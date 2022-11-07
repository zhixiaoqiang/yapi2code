/**
 * @description 对数据进一步抽象，分析json语法树
 */

/** 请求体类型 */
type ReqBody = ResObjectBody

/** 返回对象类型 */
interface ResObjectBody {
	type: YapiDataType.Object
	properties: Record<string, AllTypeNode>
	title?: string
	description?: string
	required?: string[]
}
/** 返回数组类型 */
interface ResArrayBody {
	type: YapiDataType.Array
	items: ResObjectBody
	description?: string
	required?: string[]
}

/**json抽象语法树的节点 */
type AllTypeNode =
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
	| ResObjectBody
	| ResArrayBody

/** 请求query参数 */
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

const YapiTypeMapBasicTsType = {
	[YapiDataType.Boolean]: 'boolean',
	[YapiDataType.Integer]: 'number',
	[YapiDataType.Null]: 'null',
	[YapiDataType.Number]: 'number',
	[YapiDataType.String]: 'string'
}

const YapiTypeMapTsType = {
	...YapiTypeMapBasicTsType,
	[YapiDataType.Array]: '[]',
	[YapiDataType.Object]: 'Record<string, any>'
}

export function isBasicType(type: `${YapiDataType}`) {
	const basicTypeList: string[] = [
		YapiDataType.Boolean,
		YapiDataType.Integer,
		YapiDataType.Null,
		YapiDataType.Number,
		YapiDataType.String
	]
	return basicTypeList.includes(type)
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
	return '	'.repeat(tabCount)
}
/**
 * @description GET请求参数转化typescript interface
 */
export function reqQuery2type(typeName: string, queryList: ReqQuery) {
	return `export interface I${firstCharUpperCase(typeName)}ReqQuery {${queryList
		.map((query) => {
			const linkSymbol = query.required === '0' ? '?: ' : ': '
			const key = query.name
			const comment = query.desc || ''
			return `${formatComment(comment)}\n${formatTabSpace(
				1
			)}${key}${linkSymbol}string;`
		})
		.join('')}\n}`
}

/**
 * 生成对应的内容
 * @param node
 * @param tabCount
 * @param hadAddTabCount
 * @returns
 */
function getTypeNode(
	node: AllTypeNode,
	tabCount = 0,
	hadAddTabCount = false
): string {
	if (isBasicType(node.type)) {
		return YapiTypeMapTsType[node.type] || 'any'
	} else if (YapiDataType.Object === node.type) {
		let result = '{'
		for (const [key, value] of Object.entries(node.properties)) {
			result += `${formatComment(
				value.description,
				tabCount
			)}\n${formatTabSpace(tabCount + 1)}${encodeKey(key)}${
				value.required?.includes(key) ? ': ' : '?: '
			}${getTypeNode(value, tabCount + 1, true)}`
		}
		result += `\n${formatTabSpace(tabCount)}}`
		return result
	} else if (YapiDataType.Array === node.type) {
		return (
			getTypeNode(node.items, tabCount + (hadAddTabCount ? 0 : 1)) +
			YapiTypeMapTsType[YapiDataType.Array]
		)
	}
	return ''
}

/**
 * @description POST请求体转化typescript interface
 */
export function resBody2type(
	typeName: string,
	resBody: AllTypeNode,
	suffix = 'ResBody'
) {
	const result = `export interface I${firstCharUpperCase(
		typeName
	)}${suffix} ${getTypeNode(resBody)}`

	return result
}

export function resBodyData2type(
	typeName: string,
	resBody: AllTypeNode,
	suffix = 'ResBodyData'
) {
	try {
		const isArrayType = resBody.type === YapiDataType.Array

		const prefix =
			isBasicType(resBody.type) || isArrayType
				? 'export type '
				: 'export interface I'

		return `${prefix}${firstCharUpperCase(typeName)}${suffix} ${getTypeNode(
			resBody
		)}`
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
