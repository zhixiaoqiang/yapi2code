import * as vscode from 'vscode'

import { StorageType } from '../constant'

type StorageTypePlus = `${StorageType}` | `${StorageType}_${string}`

class Store {
	context: vscode.ExtensionContext | null = null
	init(context: vscode.ExtensionContext) {
		this.context = context
	}
	setStorage(key: StorageTypePlus, value: any) {
		return this.context?.globalState.update(key, value)
	}
	getStorage<T = any>(key: StorageTypePlus): T | undefined {
		return this.context?.globalState.get(key)
	}
	clear(key: StorageTypePlus) {
		this.context?.globalState.update(key, undefined)
	}
	clearAll() {
		// 清空储存
		this.setStorage(StorageType.USER_INFO, undefined)
		this.setStorage(StorageType.LOGIN_INFO, undefined)
		this.setStorage(StorageType.COOKIE, undefined)
		this.setStorage(StorageType.DATA_GROUP, undefined)
		this.setStorage(StorageType.DATA_PROJECT, undefined)
		this.setStorage(StorageType.DATA_DIR, undefined)
		this.context?.globalState.keys().forEach((key) => {
			if (
				key.startsWith(StorageType.DATA_DIR_AND_ITEM) ||
				key.startsWith(StorageType.DATA_ITEM)
			) {
				this.setStorage(key as any, undefined)
			}
		})
		this.setStorage(StorageType.SERVER_URL, undefined)
		this.setStorage(StorageType.API_DETAIL, undefined)
		this.setStorage(StorageType.LOGIN_STAMP, undefined)
	}
}

export default new Store()
