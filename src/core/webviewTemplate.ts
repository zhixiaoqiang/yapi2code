import {
	Uri,
	type ExtensionContext,
	type WebviewViewProvider,
	type WebviewView
} from 'vscode'
import { join } from 'path'

import Dove from '../utils/dove'
import { MsgType } from '../constant/msg'

// type lifeCycleFnType = (dove: Dove) => void

export class SlideBarWebview implements WebviewViewProvider {
	context: ExtensionContext
	dove?: Dove
	onDidMount: any
	onUnMount: any
	public resolveWebviewView(webviewView: WebviewView) {
		webviewView.webview.options = {
			enableScripts: true
		}
		webviewView.webview.html = this.render(webviewView)
		/** 初始化通信增强能力 */
		const dove = new Dove((data: unknown) => {
			webviewView.webview.postMessage(data)
		})
		webviewView.webview.onDidReceiveMessage((message) => {
			dove.receiveMessage(message)
		})
		this.dove = dove

		webviewView.onDidDispose(() => {
			this.onUnMount?.(this.dove!)
		})
		this.onDidMount?.(this.dove)
	}

	constructor(context: ExtensionContext) {
		this.context = context
	}

	freshAll() {
		this.dove?.sendMessage(MsgType.FRESH_DATA, '')
	}

	render(panel: WebviewView) {
		const slideBarCssPath = panel.webview.asWebviewUri(
			Uri.file(join(this.context.extensionPath, 'dist', 'slideBar.css'))
		)
		const slideBarJsPath = panel.webview.asWebviewUri(
			Uri.file(join(this.context.extensionPath, 'dist', 'slideBar.js'))
		)

		return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Yapi To Code</title>
			<link href="${slideBarCssPath}" rel="stylesheet">

    </head>
    <body>
      <div id="app"></div>
    </body>
    <script src="${slideBarJsPath}"></script>
    </html>`
	}
}
