import * as vscode from 'vscode'

// 缓存 document
let cacheDocument: vscode.TextDocument

const createFile = async (content: string, blank = false) => {
	if (!blank && cacheDocument) {
		const edit = new vscode.WorkspaceEdit()
		edit.replace(
			cacheDocument.uri,
			new vscode.Range(0, 0, Math.max(9999, cacheDocument.lineCount), 0),
			content
		)
		await vscode.window.showTextDocument(cacheDocument)
		await vscode.languages.setTextDocumentLanguage(cacheDocument, 'typescript')
		return vscode.workspace.applyEdit(edit)
	}

	const document = await vscode.workspace.openTextDocument({
		language: 'typescript',
		content
	})

	if (!blank && !cacheDocument) {
		cacheDocument = document
	}

	vscode.window.showTextDocument(document)
}

export default createFile
