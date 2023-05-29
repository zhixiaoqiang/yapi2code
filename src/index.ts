import * as vscode from 'vscode'

import { callWhenActivate, callWhenDeactivate } from './client'

import { getSlideBarWebview } from './core'
import { writeFile } from './server/src/fileSys'
import Dove from './utils/dove'
import storage from './utils/storage'
import { ApiTypeList } from './utils/types'
import { clearComposeRequestCache } from './utils/componse'
import { getConfiguration, getWorkspaceFolder } from './common/vscodeapi'
import { Command, ContextEnum, SideBarView } from './constant/vscode'
import { GIT_REMOTE_URL } from './constant/github'
import { MsgType } from './constant/msg'
import { AllStorageType } from './constant/storage'

const container: {
	dove?: Dove
} = {}

export function activate(context: vscode.ExtensionContext): void {
	/** 初始化webview */
	const slideWebview = getSlideBarWebview(context)
	/** 初始化storage */
	storage.init(context)

	initWorkspaceConfig()

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
			clearComposeRequestCache()
			slideWebview.freshAll()
		}),
		vscode.commands.registerCommand(Command.GITHUB, () => {
			// 访问github
			vscode.env.openExternal(vscode.Uri.parse(GIT_REMOTE_URL))
		}),
		vscode.commands.registerCommand(Command.LOGOUT, () => {
			// 退出登录
			clearComposeRequestCache()
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
			const diags = fixs?.filter((item) => item.isPreferred) || []
			const edit = new vscode.WorkspaceEdit()

			for (let i = 0; i < diags.length; i++) {
				const diag = diags[i]
				const changes: {
					range: vscode.Range
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
					edit.replace(uri, item.range, item.newText)
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
				AllStorageType.API_TYPE_LIST
			) as ApiTypeList
			const newApiTypeList = oldApiTypeList?.filter(
				(file) => deleteFiles?.indexOf(file?.uri) === -1
			)
			storage.setStorage(AllStorageType.API_TYPE_LIST, newApiTypeList)
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
	/** 根据传入列表对文件进行诊断 */
	async function diagnoseBaseInputFiles(files: string[]) {
		// 发送到LSP得到诊断信息
		/**
		 * 1. 初次加载全量
		 * 2. 在文件新增、保存、删除时对文件变化进行单独诊断
		 *  诊断的文件uri存在于之前的列表中，则对该文件诊断后替换
		 *  不存在列表中，诊断后添加
		 */
		const fileTypeList =
			(await container?.dove?.sendMessage<ApiTypeList[]>(
				MsgType.API_FILE_HANDLER,
				files
			)) || []

		const results = fileTypeList?.[0]?.map((file) => file)
		const rootPath = getWorkspaceFolder(vscode.Uri.parse(results?.[0]?.uri))

		const replaceRex = rootPath?.uri?.scheme + '://' + rootPath?.uri?.fsPath
		const finalRet: ApiTypeList = results?.map((i) => ({
			...i,
			path: i?.uri?.replace(replaceRex, '')
		}))
		/**
		 * 增量去重新诊断文件列表
		 */
		// const oldApiTypeList = storage.getStorage(
		// 	AllStorageType.API_TYPE_LIST
		// ) as ApiTypeList
		// const newApiTypeList: ApiTypeList = []
		// if (!oldApiTypeList?.[0]) {
		// 	newApiTypeList.push(...finalRet)
		// } else {
		// 	newApiTypeList.push(...oldApiTypeList)
		// 	finalRet?.forEach((file) => {
		// 		const index = newApiTypeList?.findIndex((old) => old?.uri === file?.uri)
		// 		if (index > -1) {
		// 			newApiTypeList?.splice(index, 1, file)
		// 		} else {
		// 			newApiTypeList.push(file)
		// 		}
		// 	})
		// }
		/**
		 * 两种情况：
		 * 1. 列表未加载
		 *  未加载分是否已登录，已登录在webview 加载完成发送数据，未登录，在登录成功后发送数据
		 * 2. 列表已加载，直接发送
		 */
		if (
			storage.getStorage(AllStorageType.WEBVIEW_DONE) &&
			Boolean(storage.getStorage(AllStorageType.LOGIN_INFO))
		) {
			slideWebview.dove?.sendMessage(MsgType.API_FILE_HANDLER, finalRet)
		}
		storage.setStorage(AllStorageType.API_TYPE_LIST, finalRet)
	}
}

export function deactivate() {
	return callWhenDeactivate()
}

function initWorkspaceConfig() {
	storage.setStorage(AllStorageType.WORKSPACE_CONFIG, getConfiguration('yapi'))

	vscode.workspace.onDidChangeConfiguration((e) => {
		if (e.affectsConfiguration('yapi')) {
			storage.setStorage(
				AllStorageType.WORKSPACE_CONFIG,
				getConfiguration('yapi')
			)
		}
	})
}

// 获取所有待处理接口文件
async function getApiFileList() {
	const fileList: string[] = []
	// '**/*{.ts,.tsx}' 检测所有的 ts tsx 文件
	// '**/*[!(.d)]{.ts,.tsx}' 检测所有的不包含 .d 的 ts tsx 文件
	const filesFromApiFile = await vscode.workspace.findFiles(
		'**/*[!(.d)]{.ts,.tsx}',
		'**​/node_modules/**',
		200
	)

	filesFromApiFile.forEach((file) => fileList.push(file._formatted))
	return fileList
}
