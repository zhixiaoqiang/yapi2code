import * as vscode from 'vscode'

import { AllStorageType } from '../constant/storage'

type StorageTypePlus = `${AllStorageType}` | `${AllStorageType}_${string}`

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
		this.setStorage(AllStorageType.USER_INFO, undefined)
		this.setStorage(AllStorageType.LOGIN_INFO, undefined)
		this.setStorage(AllStorageType.COOKIE, undefined)
		this.setStorage(AllStorageType.DATA_GROUP, undefined)
		this.setStorage(AllStorageType.DATA_PROJECT, undefined)
		this.setStorage(AllStorageType.DATA_DIR, undefined)
		this.context?.globalState.keys().forEach((key) => {
			if (
				key.startsWith(AllStorageType.DATA_DIR_AND_ITEM) ||
				key.startsWith(AllStorageType.DATA_ITEM)
			) {
				this.setStorage(key as any, undefined)
			}
		})
		this.setStorage(AllStorageType.LOGIN_STAMP, undefined)
		this.setStorage(AllStorageType.WEBVIEW_DONE, undefined)
	}
}

export default new Store()
