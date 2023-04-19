import path from 'node:path'
import fse from 'fs-extra'
import {
	Uri,
	WorkspaceFolder,
	ExtensionContext,
	commands,
	workspace,
	window
} from 'vscode'

import { SlideBarWebview } from './webviewTemplate'
import Dove from '../utils/dove'
import {
	Command,
	MsgType,
	ContextEnum,
	StorageType,
	CONFIG_PREFIX_NAME,
	IConfig,
	DEFAULT_CONFIG
} from '../constant'
import login from '../service/login'
import {
	getGroupList,
	getProject,
	getDir,
	getItemList,
	getApiDetail,
	getDirAndItemList
} from '../service/api'
import storage from '../utils/storage'
import createFile from './createFile'
import { data2Type, formatBaseTips, formatDubboTips } from '../utils/yapi2type'
import { getWorkspaceFolders } from '../common/vscodeapi'

export const getSlideBarWebview = (context: ExtensionContext) => {
	const wv = new SlideBarWebview(context)
	const gatherKey: symbol[] = []
	wv.onDidMount = (dove: Dove) => {
		// 注册消息监听
		gatherKey.push(
			// 监听命令类型
			dove.subscribe(MsgType.COMMAND, ({ command, data }) => {
				commands.executeCommand(command, data)
			}),
			// serverUrl变化
			dove.subscribe(MsgType.SERVER_URL, (serverUrl) => {
				try {
					const { origin } = new URL(serverUrl)
					storage.setStorage(StorageType.SERVER_URL, origin)
				} catch (e) {
					storage.setStorage(StorageType.SERVER_URL, '')
				}
			}),
			// loginByLdap 变化
			dove.subscribe(MsgType.LOGIN_BY_LDAP, (loginByLdap) => {
				storage.setStorage(StorageType.LOGIN_BY_LDAP, loginByLdap)
			}),

			// 监听登录类型
			dove.subscribe(MsgType.LOGIN_NOW, ({ username, password }) => {
				return login(username, password)
					.then((res) => {
						if (res.success) {
							// 储存登录信息
							storage.setStorage(StorageType.LOGIN_INFO, {
								username,
								password
							})

							storage.setStorage(StorageType.USER_INFO, res.data?.userInfo)
							// 切换webview
							commands.executeCommand(
								'setContext',
								ContextEnum.SHOW_TREE_VIEW,
								true
							)
							// 设置是否可以接收
							if (storage.getStorage(StorageType.WEBVIEW_DONE)) {
								const apiTypeList = storage.getStorage(
									StorageType.API_TYPE_LIST
								)
								dove.sendMessage(MsgType.API_FILE_HANDLER, apiTypeList)
							}
							return true
						} else {
							commands.executeCommand(Command.WARN_TOAST, res.msg)
							return false
						}
					})
					.catch((e) => {
						console.log('登录失败', e)
					})
			}),
			// 监听是否webview加载完成
			dove.subscribe(MsgType.WEBVIEW_DONE, () => {
				console.log('webview loaded')

				// 判断当前是否登录
				const isLogin = Boolean(storage.getStorage(StorageType.USER_INFO))
				dove.sendMessage(MsgType.LOGIN_STATUS, isLogin)
				/** 设置导航栏中的menu */
				commands.executeCommand(
					'setContext',
					ContextEnum.SHOW_TREE_VIEW,
					isLogin
				)
				// 设置是否可以接收
				if (isLogin) {
					const apiTypeList = storage.getStorage(StorageType.API_TYPE_LIST)
					dove.sendMessage(MsgType.API_FILE_HANDLER, apiTypeList)
				}
				// 加载完毕
				storage.setStorage(StorageType.WEBVIEW_DONE, true)
			}),
			// 监听webview主动获取组
			dove.subscribe(
				MsgType.FETCH_GROUP,
				async (params: { needFresh: boolean }) => {
					const groupData = storage.getStorage(StorageType.DATA_GROUP)

					if (!groupData || params.needFresh) {
						const { data } = await getGroupList()
						storage.setStorage(StorageType.DATA_GROUP, data)
						return data
					} else {
						return groupData
					}
				}
			),
			// 获取yapi项目文件夹
			dove.subscribe(
				MsgType.FETCH_PROJECT,
				async (params: { needFresh: boolean; groupId: number }) => {
					const projectData = storage.getStorage(
						`${StorageType.DATA_PROJECT}_${params.groupId}`
					)
					if (!projectData || params.needFresh) {
						const { data } = await getProject(params.groupId)
						storage.setStorage(
							`${StorageType.DATA_PROJECT}_${params.groupId}`,
							data
						)
						return data
					} else {
						return projectData
					}
				}
			),
			// 获取yapi文件夹
			dove.subscribe(
				MsgType.FETCH_DIR,
				async (params: { needFresh: boolean; dirId: number }) => {
					const dirData = storage.getStorage(
						`${StorageType.DATA_DIR}_${params.dirId}`
					)

					if (!dirData || params.needFresh) {
						const { data } = await getDir(params.dirId)
						storage.setStorage(`${StorageType.DATA_DIR}_${params.dirId}`, data)
						return data
					} else {
						return dirData
					}
				}
			),
			// 获取yapi文件夹及接口列表
			dove.subscribe(
				MsgType.FETCH_DIR_AND_ITEM,
				async (params: { needFresh: boolean; projectId: number }) => {
					const storageKey =
						`${StorageType.DATA_DIR_AND_ITEM}_${params.projectId}` as const
					const dirAndItemData = storage.getStorage(storageKey)
					if (!dirAndItemData || params.needFresh) {
						const { data } = await getDirAndItemList(params.projectId)
						storage.setStorage(storageKey, data)
						return data
					} else {
						return dirAndItemData
					}
				}
			),
			// 获取item数据
			dove.subscribe(
				MsgType.FETCH_ITEM,
				async (params: { needFresh: boolean; itemId: number }) => {
					const itemData = storage.getStorage(
						`${StorageType.DATA_ITEM}_${params.itemId}`
					)

					if (!itemData || params.needFresh) {
						const { data } = await getItemList(params.itemId)
						storage.setStorage(
							`${StorageType.DATA_ITEM}_${params.itemId}`,
							data || {
								count: 0,
								total: 0,
								list: []
							}
						)
						return data
					} else {
						return itemData
					}
				}
			),
			// 获取详情数据
			dove.subscribe(MsgType.FETCH_DETAIL, async ({ id, blank }) => {
				let config = {
					...DEFAULT_CONFIG,
					...(storage.getStorage(StorageType.WORKSPACE_CONFIG) as IConfig)
				}
				try {
					const projectConfig = await getProjectConfig()

					config = { ...config, ...projectConfig }
				} catch (error) {
					console.error('get config error', error)
				}

				const { data } = await getApiDetail(id).catch((e) => {
					commands.executeCommand(Command.WARN_TOAST, '请求失败，无法预览')
					commands.executeCommand(Command.WARN_TOAST, e?.toString())
					return {
						data: null
					}
				})

				if (data?.method === 'DUBBO') {
					return createFile(formatDubboTips(data))
				}

				if (data?.path) {
					try {
						const tsData = data2Type(data, config)
						createFile(
							[
								tsData.reqQueryType,
								tsData.reqBodyType,
								tsData.resType,
								tsData.requestContent
							]
								.filter(Boolean)
								.join('\n'),
							blank
						)
					} catch (error) {
						console.log('preview code', error)
						createFile(
							[
								formatBaseTips(data, '生成异常'),
								data ? JSON.stringify(data, null, 2) : ''
							].join('\n')
						)
						commands.executeCommand(Command.WARN_TOAST, '无法预览')
					}
					return
				}

				commands.executeCommand(Command.WARN_TOAST, '无法预览')
			}),
			// 打开指定文件
			dove.subscribe(MsgType.OPEN_FILE, async (data) => {
				if (data) {
					openLocalFile(data?.replace('file://', ''))
				}
			})
		)
	}
	wv.onUnMount = (dove: Dove) => {
		// 卸载消息监听
		console.log('卸载消息')
		storage.setStorage(StorageType.WEBVIEW_DONE, false)
		gatherKey.map((key) => {
			dove.unSubscribe(key)
		})
	}
	return wv
}

export function openLocalFile(filePath: string) {
	// 获取TextDocument对象
	workspace.openTextDocument(filePath).then(
		(doc) => {
			// 在VSCode编辑窗口展示读取到的文本
			window.showTextDocument(doc)
		},
		(err) => {
			console.log(`Open ${filePath} error, ${err}.`)
		}
	)
}

export async function getProjectRoot(): Promise<WorkspaceFolder> {
	const workspaces: readonly WorkspaceFolder[] = getWorkspaceFolders()
	if (workspaces.length === 0) {
		return {
			uri: Uri.file(process.cwd()),
			name: path.basename(process.cwd()),
			index: 0
		}
	} else if (workspaces.length === 1) {
		return workspaces[0]
	} else {
		let rootWorkspace = workspaces[0]
		let root = undefined
		for (const w of workspaces) {
			if (await fse.pathExists(w.uri.fsPath)) {
				root = w.uri.fsPath
				rootWorkspace = w
				break
			}
		}

		for (const w of workspaces) {
			if (
				root &&
				root.length > w.uri.fsPath.length &&
				(await fse.pathExists(w.uri.fsPath))
			) {
				root = w.uri.fsPath
				rootWorkspace = w
			}
		}
		return rootWorkspace
	}
}

export async function getProjectConfig() {
	const workspaceFolder = await getProjectRoot()
	let config
	if (workspaceFolder) {
		return workspace.fs
			.readFile(Uri.joinPath(workspaceFolder.uri, CONFIG_PREFIX_NAME))
			.then(
				(res) => {
					try {
						config = eval(res.toString())?.()
						return config
					} catch (error) {
						console.log('配置异常，请检查配置项', error)
						commands.executeCommand(
							Command.WARN_TOAST,
							`配置异常，请检查配置项 ${error}`
						)
					}
				},
				(err) => {
					console.log('error', err)
				}
			)
	}
	return config
}
