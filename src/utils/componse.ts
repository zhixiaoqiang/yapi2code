type taskType = (...args: any[]) => Promise<any>

const store = new (class {
	tasks: Map<
		taskType,
		Map<
			string,
			{
				lastFetchTime: number
				execResult: any
				durTime: number
			}
		>
	> = new Map()
})()

/**
 * 清除接口缓存
 */
export function clearComposeRequestCache() {
	for (const [key] of store.tasks) {
		store.tasks.get(key)?.clear()
	}
}

/**
 * @func 接口缓存，短时间内相同的请求会合并到同一个请求
 * @param durTime 缓存时间，单位ms
 */
export function composeRequest(task: taskType, durTime = 1000) {
	store.tasks.set(task, new Map())
	return async (params?: any, needFresh = false) => {
		const item = store.tasks.get(task)
		if (!item) {
			return
		}
		const key = JSON.stringify([params])
		if (!item.get(key)) {
			item.set(key, {
				lastFetchTime: 0,
				execResult: null,
				durTime
			})
		}
		const current = item.get(key)
		if (!current) {
			return
		}
		if (Date.now() - current.lastFetchTime > current.durTime || needFresh) {
			current.lastFetchTime = Date.now()
			current.execResult = task(params).catch(() => {
				// 出错则清除
				current.lastFetchTime = 0
				return new TypeError('error')
			})
		}
		return current.execResult
	}
}
