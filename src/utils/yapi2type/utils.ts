/**
 * @description key转义
 */
export function encodeKey(key: string) {
	return encodeURIComponent(key) === key ? key : `"${key}"`
}

/**
 * 解析JSON, 包含解析非标准的 json, e.g.: "{a:1}"
 * @param content 内容
 * @returns 对象
 */
export function parseJson(content: string) {
	if (!content) {
		return {}
	}

	function convertStringToObj(str: string) {
		let obj
		eval('obj =' + str)
		return obj
	}

	try {
		const data = JSON.parse(content)
		return typeof data === 'string' ? convertStringToObj(content) : data
	} catch (error) {
		return convertStringToObj(content)
	}
}
