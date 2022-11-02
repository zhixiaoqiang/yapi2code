import type { QuickFixFunctionStruct, ImportPositionInfo } from './types'
import type { Position } from 'vscode-languageserver-types'

// 用于储存diagnostic
class DiagStore {
	diagnosticMap: Map<string, QuickFixFunctionStruct> = new Map()
	importPositionInfo: Map<string, ImportPositionInfo> = new Map()
	yapiResponseNameInfo: Map<string, Position> = new Map()
	detail: any = {}

	setCurDiagnostic(key: string, diagnostic: QuickFixFunctionStruct) {
		this.diagnosticMap.set(key, diagnostic)
	}
	clear = () => {
		this.diagnosticMap = new Map()
		this.importPositionInfo = new Map()
		this.yapiResponseNameInfo = new Map()
		this.detail = {}
	}
}

export default new (class {
	documentPool: Map<string, DiagStore> = new Map()

	add(url: string) {
		const diagStore = new DiagStore()
		this.documentPool.set(url, diagStore)
		return diagStore
	}

	get(url: string) {
		const diagStore = this.documentPool.get(url)
		if (!diagStore) {
			return this.add(url)
		}
		return diagStore
	}

	remove(url: string) {
		this.documentPool.delete(url)
	}
})()
