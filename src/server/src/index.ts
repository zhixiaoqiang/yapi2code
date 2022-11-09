import { SourceFile } from 'typescript'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
	CodeAction,
	CodeActionKind,
	CodeActionParams,
	createConnection,
	Diagnostic,
	DiagnosticSeverity,
	DidChangeConfigurationNotification,
	InitializeParams,
	InitializeResult,
	ProposedFeatures,
	TextDocuments,
	TextDocumentSyncKind
} from 'vscode-languageserver/node'
import { Command, MsgType } from '../../constant'
import { API_NOT_DEFINED, MAIN_MSG } from '../../utils/constant'
import Dove from '../../utils/dove'
import { YapiVSCodeConfig } from '../../utils/types'
import { getAST } from './astree'
import { loadFile } from './fileSys'
import {
	getApiPositionList,
	getImportTypePosition,
	getYapiResponseInfo
} from './parseAST'
import { quickfix } from './quickfix'
import store from './store'
import type { ApiFunctionStruct, ImportPositionInfo } from './types'

// 初始化 LSP 连接对象
export const connection = createConnection(ProposedFeatures.all)
console.log('server init')

// 创建文档集合对象，用于映射到实际文档
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

let hasConfigurationCapability = false

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	)

	const hasCodeActionLiteralsCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.codeAction &&
		capabilities.textDocument.codeAction.codeActionLiteralSupport
	)
	// 明确声明插件支持的语言特性
	const result: InitializeResult = {
		capabilities: {
			// 启用文档增量更新同步
			textDocumentSync: TextDocumentSyncKind.Incremental
		}
	}

	if (hasCodeActionLiteralsCapability) {
		result.capabilities.codeActionProvider = {
			codeActionKinds: [CodeActionKind.QuickFix]
		}
	}
	return result
})

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		)
	}
	dove.sendMessage(MsgType.LSP_DONE, {})
})

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// 监听连接
connection.listen()

// 初始化通信器
const dove = new Dove((msg: any) => {
	connection.sendNotification(MAIN_MSG, msg)
})
// 收到消息
connection.onNotification(MAIN_MSG, (data: any) => {
	dove.receiveMessage(data)
})
// 监听消息
dove.subscribe(MsgType.FIX_ALL, async (uri: string) => {
	const fixs = await provideCodeActions(store.get(uri).detail, true).catch(
		(e) => {
			dove.sendMessage(MsgType.COMMAND, {
				command: Command.WARN_TOAST,
				data: 'Yapi请求失败'
			})
			return []
		}
	)
	console.log('请求结束')
	if (!fixs.length) {
		return
	}
	return fixs
})

//关闭文件时清空储存
documents.onDidClose((change) => {
	const uri = change.document.uri
	store.remove(uri)
})

// 增量错误诊断
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document)
})

// 设置
const defaultSettings: YapiVSCodeConfig = { responseType: '' }
let globalSettings: YapiVSCodeConfig = defaultSettings

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<YapiVSCodeConfig>> = new Map()

connection.onDidChangeConfiguration((change) => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear()
	} else {
		console.log(change.settings, 'change.settings')

		globalSettings = <YapiVSCodeConfig>(change.settings.yapi || defaultSettings)
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument)
})

function getDocumentSettings(resource: string): Thenable<YapiVSCodeConfig> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings)
	}
	let result = documentSettings.get(resource)

	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'yapi'
		})
		documentSettings.set(resource, result)
	}
	return result
}

// Only keep settings for open documents
documents.onDidClose((e) => {
	documentSettings.delete(e.document.uri)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	console.log('change', textDocument.uri, textDocument)
	// 获取文档纯文本
	const text = textDocument.getText()

	const diagStore = store.get(textDocument.uri)
	diagStore.clear()

	// 获取项目yapi配置
	const yapiConfig = await getDocumentSettings(textDocument.uri)

	// 生成抽象语法树 AST
	const ast: SourceFile = getAST(text)
	// 遍历 AST 筛选符合标记的节点位置列表
	const apiFnList: ApiFunctionStruct[] = getApiPositionList(ast, yapiConfig)

	// 获取import type的位置，已存在则用现在，没有则获取最后import插入位置
	const importInfo = await getImportTypePosition(ast)

	// 获取yapiResponse类型的位置
	const yapiResponseTypeInfo = getYapiResponseInfo(ast)
	// 插入点
	const importPos: ImportPositionInfo = {
		type: 'useOld',
		position: {
			line: 0,
			character: 0
		},
		nameList: []
	}
	if (importInfo.type === 'useOld') {
		// 使用已有的
		importPos.position = textDocument.positionAt(importInfo.position)
		importPos.nameList = importInfo.nameList || []
	} else {
		// 新注入
		importPos.type = 'useNew'
		const pos = textDocument.positionAt(importInfo.position)
		importPos.position =
			importInfo.position === 0
				? { line: 0, character: 0 }
				: {
						line: pos.line,
						character: pos.character
				  }
	}

	const diagnostics: Diagnostic[] = []

	for (const apiFn of apiFnList) {
		const mayTipsMessage = `${apiFn.apiPath} ${API_NOT_DEFINED} ${
			Number.isFinite(apiFn.paramTypeInsertPosition) ? '未定义参数类型' : ''
		} ${
			Number.isFinite(apiFn.fnRespTypeInsertPosition) ? '未定义返回值类型' : ''
		}
    ${
			Number.isFinite(apiFn.methodGenericInsertPosition)
				? '未定义返回值类型'
				: ''
		}`

		const tipsMessage = getSubName(diagStore.diagnosticMap, mayTipsMessage)

		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Information,
			range: {
				start: textDocument.positionAt(apiFn.pos + 1),
				end: textDocument.positionAt(apiFn.end)
			},
			message: tipsMessage,
			source: 'yapi to code'
		}
		diagStore.setCurDiagnostic(tipsMessage, {
			paramTypeInsertPosition: Number.isFinite(apiFn.paramTypeInsertPosition)
				? textDocument.positionAt(apiFn.paramTypeInsertPosition!)
				: undefined,
			fnRespTypeInsertPosition: Number.isFinite(apiFn.fnRespTypeInsertPosition)
				? textDocument.positionAt(apiFn.fnRespTypeInsertPosition!)
				: undefined,
			methodGenericInsertPosition: Number.isFinite(
				apiFn.methodGenericInsertPosition
			)
				? textDocument.positionAt(apiFn.methodGenericInsertPosition!)
				: undefined,
			apiPath: apiFn.apiPath,
			requestFn: apiFn.requestFn
		})
		diagStore.importPositionInfo.set(tipsMessage, importPos)

		if (yapiResponseTypeInfo.type === 'useNew') {
			// 插入 YapiResponse
			const pos = textDocument.positionAt(yapiResponseTypeInfo.position)
			diagStore.yapiResponseNameInfo.set(tipsMessage, {
				line: pos.line + 1,
				character: 0
			})
		} else {
			diagStore.yapiResponseNameInfo.delete(tipsMessage)
		}
		diagnostics.push(diagnostic)
	}

	diagStore.detail = {
		textDocument,
		context: {
			diagnostics
		},
		diagnostics
	}

	// 发送诊断信息
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onCodeAction((params) => provideCodeActions(params))

async function provideCodeActions(
	parms: CodeActionParams,
	isFixAll?: boolean
): Promise<CodeAction[]> {
	if (!parms.context.diagnostics.length) {
		return []
	}
	const document = parms.textDocument
	if (!document) {
		return []
	}
	return quickfix(dove, parms, isFixAll)
}

/** 获取副本名字 */
function getSubName(diagMap: any, name: string, init = 1): string {
	return diagMap.get(name) ? getSubName(diagMap, name + init, init + 1) : name
}

/** 保存获取接口列表进行校验 */
dove.subscribe(MsgType.API_FILE_HANDLER, async (apiFileList: any) => {
	const results = await Promise.all(
		apiFileList?.map(async (file: string) => {
			// 获取项目yapi配置
			const yapiConfig = await getDocumentSettings(file)
			const text = await loadFile(file?.replace('file://', ''))

			// 生成抽象语法树 AST
			const ast: SourceFile = getAST(text)
			// 遍历 AST 筛选符合标记的节点位置列表
			const apiFnList: ApiFunctionStruct[] = getApiPositionList(ast, yapiConfig)
			return {
				uri: file,
				apiFnList: apiFnList
			}
		})
	)
	return results
})
