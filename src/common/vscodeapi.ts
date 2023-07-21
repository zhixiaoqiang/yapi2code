import path from 'node:path'
import { pathExists } from 'fs-extra'

import {
	commands,
	ConfigurationScope,
	Disposable,
	LogOutputChannel,
	Uri,
	window,
	workspace,
	WorkspaceFolder
} from 'vscode'
import { Command } from '../constant/vscode'
import { CONFIG_FILE_NAME, IConfig } from '../constant/config'
import { debugVscodeApi } from '@/debug'

export function createOutputChannel(name: string): LogOutputChannel {
	return window.createOutputChannel(name, { log: true })
}

export function getConfiguration(config?: string, scope?: ConfigurationScope) {
	return workspace.getConfiguration(config, scope) as unknown as IConfig
}

export function registerCommand(
	command: string,
	callback: (...args: any[]) => any,
	thisArg?: any
): Disposable {
	return commands.registerCommand(command, callback, thisArg)
}

export const { onDidChangeConfiguration } = workspace

export function isVirtualWorkspace(): boolean {
	const isVirtual =
		workspace.workspaceFolders &&
		workspace.workspaceFolders.every((f) => f.uri.scheme !== 'file')
	return !!isVirtual
}

export function getWorkspaceFolders(): readonly WorkspaceFolder[] {
	return workspace.workspaceFolders ?? []
}

export function getWorkspaceFolder(uri: Uri): WorkspaceFolder | undefined {
	return workspace.getWorkspaceFolder(uri)
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

		for (const w of workspaces) {
			if (await pathExists(w.uri.fsPath)) {
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
			.readFile(Uri.joinPath(workspaceFolder.uri, CONFIG_FILE_NAME))
			.then(
				(res) => {
					try {
						config = eval(res.toString())?.()
						return config
					} catch (error) {
						debugVscodeApi('配置文件异常，请检查配置项', error)
						commands.executeCommand(
							Command.WARN_TOAST,
							`配置异常，请检查配置项 ${error}`
						)
					}
				},
				(err) => {
					debugVscodeApi('getProjectConfig error', err)
				}
			)
	}
	return config
}
