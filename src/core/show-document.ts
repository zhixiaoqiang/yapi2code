import {
	WorkspaceEdit,
	Range,
	window,
	languages,
	commands,
	workspace,
	type TextDocument
} from 'vscode'

type showDocumentFn = (
	/** 内容 */
	content: string,
	options?: {
		/** 是否新开 */
		blank?: boolean
		/** 是否格式化 */
		format?: boolean
	}
) => Promise<void>

// 缓存 document
let cacheDocument: TextDocument

/** 将内容展示到文本编辑窗口 */
const showDocument: showDocumentFn = async (
	content,
	{ blank = false, format = false } = {}
) => {
	if (!blank && cacheDocument) {
		const edit = new WorkspaceEdit()
		edit.replace(
			cacheDocument.uri,
			new Range(0, 0, Math.max(9999, cacheDocument.lineCount), 0),
			content
		)
		await window.showTextDocument(cacheDocument)
		await languages.setTextDocumentLanguage(cacheDocument, 'typescript')

		await workspace.applyEdit(edit)
		if (format) {
			await commands.executeCommand<string>('editor.action.formatDocument')
		}
		return
	}

	const document = await workspace.openTextDocument({
		language: 'typescript',
		content
	})

	if (!blank && !cacheDocument) {
		cacheDocument = document
	}

	await window.showTextDocument(document)
	if (format) {
		await commands.executeCommand<string>('editor.action.formatDocument')
	}
}

export default showDocument
