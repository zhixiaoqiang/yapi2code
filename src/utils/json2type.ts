/**
 * @description 对数据进一步抽象，分析json语法树
 */
// 返回类型
interface ResBody {
	type: YapiDataType.Object
	properties: Record<string, TypeNode>
	description?: string
	required?: string
}

// 请求体类型
type ReqBody = ResBody

interface ResBodyData {
	type: YapiDataType
	properties?: Record<string, TypeNode>
	description?: string
	required?: string
}

//json抽象语法树的节点
type TypeNode =
	| {
			type:
				| YapiDataType.Number
				| YapiDataType.Integer
				| YapiDataType.String
				| YapiDataType.Boolean
				| YapiDataType.Null
			description?: string
			required?: string
	  }
	| ResBody
	| {
			type: YapiDataType.Array
			items: ResBody
			description?: string
			required?: string
	  }

// 请求query参数
type ReqQuery = {
	required: string
	_id: string
	name: string
	desc: string
}[]

const enum YapiDataType {
	Array = 'array',
	Boolean = 'boolean',
	Integer = 'integer',
	Null = 'null',
	Number = 'number',
	Object = 'object',
	String = 'string'
}

const YapiTypeMapTsType = {
	[YapiDataType.Array]: '[]',
	[YapiDataType.Boolean]: 'boolean',
	[YapiDataType.Integer]: 'number',
	[YapiDataType.Null]: 'null',
	[YapiDataType.Number]: 'number',
	[YapiDataType.Object]: 'Record<string, any>',
	[YapiDataType.String]: 'string'
}
/**
 * @description 首字母大写
 */
export function firstCharUpperCase(word: string) {
	if (!word) {
		return ''
	}
	return word[0].toUpperCase() + word.slice(1)
}
/**
 * @description 格式化注释
 */
export function formatComment(comment: string | undefined, tabCount = 0) {
	return comment ? `\n${formatTabSpace(tabCount + 1)}/** ${comment} */` : ''
}
/**
 * @description 格式化tab
 */
export function formatTabSpace(tabCount: number) {
	return '  '.repeat(tabCount)
}
/**
 * @description GET请求参数转化typescript interface
 */
export function reqQuery2type(typeName: string, queryList: ReqQuery) {
	let result = `export interface ${firstCharUpperCase(typeName)}ReqQuery {`
	queryList.forEach((query) => {
		const linkSymbol = query.required === '0' ? '?: ' : ': '
		const key = query.name
		const comment = query.desc || ''
		result += `${formatComment(comment)}\n${formatTabSpace(
			1
		)}${key}${linkSymbol}string;`
	})
	return result + '\n}'
}
/**
 * @description POST请求体转化typescript interface
 */
export function resBody2type(
	typeName: string,
	resBody: ResBody,
	title = 'ResBody'
) {
	function typeNode(node: TypeNode, tabCount = 0): any {
		if (
			[
				YapiDataType.Boolean,
				YapiDataType.Integer,
				YapiDataType.Null,
				YapiDataType.Number,
				YapiDataType.String
			].indexOf(node.type) !== -1
		) {
			return YapiTypeMapTsType[node.type]
		}
		if (node.type === YapiDataType.Object) {
			let result = '{'
			for (const [key, value] of Object.entries(node.properties)) {
				result += `${formatComment(
					value.description,
					tabCount
				)}\n${formatTabSpace(tabCount + 1)}${encodeKey(key)}${
					value.required === '0' ? '?: ' : ': '
				}${typeNode(value, tabCount + 1)}`
			}
			result += `\n${formatTabSpace(tabCount)}}`
			return result
		}
		if (node.type === YapiDataType.Array) {
			return (
				typeNode(node.items, tabCount + 1) +
				YapiTypeMapTsType[YapiDataType.Array]
			)
		}
	}
	const result = `export interface ${firstCharUpperCase(
		typeName
	)}${title} ${typeNode(resBody)}`

	return result
}

export function resBodyData2type(
	typeName: string,
	resBody: TypeNode,
	title = 'ResBodyData'
) {
	function typeNode(node: TypeNode, tabCount = 0): any {
		if (
			[
				YapiDataType.Boolean,
				YapiDataType.Integer,
				YapiDataType.Null,
				YapiDataType.Number,
				YapiDataType.String
			].indexOf(node.type) !== -1
		) {
			return YapiTypeMapTsType[node.type]
		}
		if (node.type === YapiDataType.Object) {
			let result = '{'
			for (const [key, value] of Object.entries(node.properties)) {
				result += `${formatComment(
					value.description,
					tabCount
				)}\n${formatTabSpace(tabCount + 1)}${encodeKey(key)}${
					value.required === '0' ? '?: ' : ': '
				}${typeNode(value, tabCount + 1)}`
			}
			result += `\n${formatTabSpace(tabCount)}}`
			return result
		}
		if (node.type === YapiDataType.Array) {
			return (
				typeNode(node.items, tabCount + 1) +
				YapiTypeMapTsType[YapiDataType.Array]
			)
		}
	}

	try {
		const isBasicType =
			[
				YapiDataType.Boolean,
				YapiDataType.Integer,
				YapiDataType.Null,
				YapiDataType.Number,
				YapiDataType.String
			].indexOf(resBody.type) !== -1

		const isArrayType = resBody.type === YapiDataType.Array

		let result = ''
		if (isBasicType || isArrayType) {
			result = `export type ${firstCharUpperCase(
				typeName
			)}${title} = ${typeNode(resBody)}`
		} else {
			result = `export interface ${firstCharUpperCase(
				typeName
			)}${title} ${typeNode(resBody)}`
		}
		return result
	} catch (error) {
		return ''
	}
}
/**
 * @description POST响应体转化typescript interface
 */
export function reqBody2type(typeName: string, reqBody: ReqBody) {
	return resBody2type(typeName, reqBody, 'ReqBody')
}

/**
 * @description key转义
 */
export function encodeKey(key: string) {
	return encodeURIComponent(key) === key ? key : `"${key}""`
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
		const objectStr = str.replace('\\"', '"')
		let obj
		eval('obj =' + objectStr)
		return obj
	}

	try {
		const data = JSON.parse(content)
		return typeof data === 'string' ? convertStringToObj(content) : data
	} catch (error) {
		return convertStringToObj(content)
	}
}
