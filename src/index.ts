import * as vscode from 'vscode'

import { callWhenActivate, callWhenDeactivate } from './client'
import {
	Command,
	ContextEnum,
	GIT_REMOTE_URL,
	MsgType,
	SideBarView,
	StorageType
} from './constant'
import { getSlideBarWebview } from './core'
import { writeFile } from './server/src/fileSys'
import Dove from './utils/dove'
import storage from './utils/storage'
import { ApiTypeList } from './utils/types'

const container: {
	dove?: Dove
} = {}

export function activate(context: vscode.ExtensionContext): void {
	/** 初始化webview */
	const slideWebview = getSlideBarWebview(context)
	/** 初始化storage */
	storage.init(context)

	/** 初始化vscode功能 */
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			SideBarView.YAPI_VIEW,
			slideWebview,
			{
				webviewOptions: {
					retainContextWhenHidden: true
				}
			}
		),
		vscode.commands.registerCommand(Command.WARN_TOAST, (msg: string) => {
			vscode.window.showWarningMessage(msg)
		}),
		vscode.commands.registerCommand(Command.REFRESH, () => {
			// 刷新接口
			slideWebview.freshAll()
		}),
		vscode.commands.registerCommand(Command.GITHUB, () => {
			// 访问github
			vscode.env.openExternal(vscode.Uri.parse(GIT_REMOTE_URL))
		}),
		vscode.commands.registerCommand(Command.LOGOUT, () => {
			// 退出登录
			storage.clearAll()
			vscode.commands.executeCommand(
				'setContext',
				ContextEnum.SHOW_TREE_VIEW,
				false
			)
			slideWebview.dove?.sendMessage(MsgType.LOGIN_STATUS, false)
		}),
		vscode.commands.registerCommand(
			Command.INSERT_TYPE,
			async ({ filePath, text }) => {
				console.log(filePath, text.slice(1, 10))
				// 写入类型文本到文件
				await writeFile(filePath, text)
			}
		),
		vscode.commands.registerCommand(Command.FIX_ALL, async () => {
			const uri = vscode.window.activeTextEditor?.document.uri
			if (!container.dove || !uri) {
				return
			}
			// 修复所有类型
			const url = uri.scheme + '://' + uri.fsPath
			const [fixs] = await container.dove.sendMessage<any[][]>(
				MsgType.FIX_ALL,
				url
			)
			const diags = fixs.filter((item) => item.isPreferred)
			const edit = new vscode.WorkspaceEdit()

			for (let i = 0; i < diags.length; i++) {
				const diag = diags[i]
				const changes: {
					range: {
						start: vscode.Position
						end: vscode.Position
					}
					newText: string
				}[] = diag.edit.changes[url]
				const commandInfo = diag.command
				// 写入类型文件
				await vscode.commands.executeCommand(
					Command.INSERT_TYPE,
					commandInfo.arguments[0]
				)
				// 写入文件变更
				changes.map((item) => {
					if (i !== 0 && item.newText.includes('type YapiResponse')) {
						return
					}
					edit.replace(uri, item.range as any, item.newText)
				})
			}
			await vscode.workspace.applyEdit(edit)
		}),
		// 保存文件
		vscode.workspace.onDidSaveTextDocument((e) => {
			const absPath = e.uri.scheme + '://' + e.uri.fsPath
			if (container.dove) {
				diagnoseBaseInputFiles([absPath])
			}
		}),
		vscode.workspace.onDidDeleteFiles((e) => {
			const deleteFiles = e.files?.map(
				(file) => file.scheme + '://' + file.fsPath
			)
			const oldApiTypeList = storage.getStorage(
				StorageType.API_TYPE_LIST
			) as ApiTypeList
			const newApiTypeList = oldApiTypeList?.filter(
				(file) => deleteFiles?.indexOf(file?.uri) === -1
			)
			storage.setStorage(StorageType.API_TYPE_LIST, newApiTypeList)
		})
	)
	// 创建LSP客户端连接服务器
	container.dove = callWhenActivate(context)
	// init fetch
	container.dove.subscribe(MsgType.LSP_DONE, () => {
		refreshApiFileList()
	})
	async function refreshApiFileList() {
		console.log('init request')

		const files = await getApiFileList()
		diagnoseBaseInputFiles(files)
	}
	// 根据传入列表对文件进行诊断
	async function diagnoseBaseInputFiles(files: string[]) {
		// 发送到LSP得到诊断信息
		/**
		 * 1. 初次加载全量
		 * 2. 在文件新增、保存、删除时对文件变化进行单独诊断
		 *  诊断的文件uri存在于之前的列表中，则对该文件诊断后替换
		 *  不存在列表中，诊断后添加
		 */
		const fileTypeList =
			(await container?.dove?.sendMessage(MsgType.API_FILE_HANDLER, files)) ||
			[]
		const results = (fileTypeList as ApiTypeList[])?.[0]?.map((file) => file)
		const rootPath = vscode.workspace.getWorkspaceFolder(
			vscode.Uri.parse(results?.[0]?.uri)
		)
		const replaceRex = rootPath?.uri?.scheme + '://' + rootPath?.uri?.fsPath
		const finalRet: ApiTypeList = results?.map((i) => ({
			...i,
			path: i?.uri?.replace(replaceRex, '')
		}))
		/**
		 * 增量去重新诊断文件列表
		 */
		const oldApiTypeList = storage.getStorage(
			StorageType.API_TYPE_LIST
		) as ApiTypeList
		const newApiTypeList: ApiTypeList = []
		if (!oldApiTypeList?.[0]) {
			newApiTypeList.push(...finalRet)
		} else {
			newApiTypeList.push(...oldApiTypeList)
			finalRet?.forEach((file) => {
				const index = newApiTypeList?.findIndex((old) => old?.uri === file?.uri)
				if (index > -1) {
					newApiTypeList?.splice(index, 1, file)
				} else {
					newApiTypeList.push(file)
				}
			})
		}
		/**
		 * 两种情况：
		 * 1. 列表未加载
		 *  未加载分是否已登录，已登录在webview 加载完成发送数据，未登录，在登录成功后发送数据
		 * 2. 列表已加载，直接发送
		 */
		if (
			storage.getStorage(StorageType.WEBVIEW_DONE) &&
			Boolean(storage.getStorage(StorageType.LOGIN_INFO))
		) {
			slideWebview.dove?.sendMessage(MsgType.API_FILE_HANDLER, newApiTypeList)
		}
		storage.setStorage(StorageType.API_TYPE_LIST, newApiTypeList)
	}
}

export function deactivate() {
	return callWhenDeactivate()
}

// 获取所有待处理接口文件
async function getApiFileList() {
	const fileList: string[] = []
	const filesFromApiDir = await vscode.workspace.findFiles(
		'**/api/**/*.ts',
		'node_modules/*',
		100
	)
	filesFromApiDir.forEach((file) =>
		fileList.push(file.scheme + '://' + file.fsPath)
	)
	const filesFromApiFile = await vscode.workspace.findFiles(
		'**/api.ts',
		'node_modules/*',
		100
	)
	filesFromApiFile.forEach((file) =>
		fileList.push(file.scheme + ':' + file.fsPath)
	)
	return fileList
}
