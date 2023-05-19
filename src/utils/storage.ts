import * as vscode from 'vscode'

import { AllStorageType, StorageType } from '../constant/storage'

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
		Object.values(StorageType).forEach((key) => {
			this.clear(key)
		})

		this.context?.globalState.keys().forEach((key) => {
			if (
				key.startsWith(StorageType.DATA_DIR_AND_ITEM) ||
				key.startsWith(StorageType.DATA_ITEM)
			) {
				this.clear(key as any)
			}
		})
	}
}

export default new Store()
