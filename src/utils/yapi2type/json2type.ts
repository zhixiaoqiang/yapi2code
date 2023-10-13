/**
 * @description 对数据进一步抽象，分析json语法树
 */
import { encodeKey } from './utils'

/** 请求体类型 */
type ReqBody = ResObjectBody

/** 返回对象类型 */
interface ResObjectBody {
	/** 数据类型 */
	type: `${YapiDataType.Object}`
	/** 属性枚举 */
	properties: Record<string, AllTypeNode>
	title?: string
	description?: string
	required?: string[]
}
/** 返回数组类型 */
interface ResArrayBody {
	type: `${YapiDataType.Array}`
	items: ResObjectBody
	description?: string
	required?: string[]
}

/** json抽象语法树的节点 */
export type AllTypeNode =
	| {
			type: `${
				| YapiDataType.Number
				| YapiDataType.Integer
				| YapiDataType.String
				| YapiDataType.Boolean
				| YapiDataType.Null
				| YapiDataType.Long}`
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
	String = 'string',
	Long = 'long'
}

const YapiTypeMapBasicTsType = {
	[YapiDataType.Boolean]: 'boolean',
	[YapiDataType.Integer]: 'number',
	[YapiDataType.Null]: 'null',
	[YapiDataType.Number]: 'number',
	[YapiDataType.String]: 'string',
	[YapiDataType.Long]: 'string | number'
}

const YapiTypeMapTsType = {
	...YapiTypeMapBasicTsType,
	[YapiDataType.Array]: '[]',
	[YapiDataType.Object]: 'Record<string, any>',
	int64: 'number',
	text: 'string'
}

export function isBasicType(
	type: `${YapiDataType}`
): type is keyof typeof YapiTypeMapBasicTsType {
	const basicTypeList: string[] = [
		YapiDataType.Boolean,
		YapiDataType.Integer,
		YapiDataType.Null,
		YapiDataType.Number,
		YapiDataType.String,
		YapiDataType.Long
	]
	return basicTypeList.includes(type)
}

/**
 * @description 首字母大写，可以拼接后缀
 */
export function firstCharUpperCase(word: string, suffix = '') {
	if (!word) {
		return ''
	}
	return word[0].toUpperCase() + word.slice(1) + suffix
}

let isUseTab = false

export function updateUseTab(useTab?: boolean) {
	isUseTab = !!useTab
}

/**
 * @description 格式化tab
 */
export function formatTabSpace(tabCount: number) {
	return (isUseTab ? '	' : '  ').repeat(tabCount)
}

/**
 * @description 格式化注释
 */
export function formatComment(comment: string | undefined, tabCount = 0) {
	return comment ? `\n${formatTabSpace(tabCount)}/** ${comment} */` : ''
}

/**
 * @description GET请求参数转化typescript interface
 */
export function reqQuery2type(typeName: string, queryList: ReqQuery) {
	const typeNameData = getTypeNameData(
		typeName,
		YapiDataType.Object,
		'ReqQuery'
	)

	return `export ${typeNameData.type} ${typeNameData.name} {${queryList
		.map((query) => {
			const comment = formatComment(query.desc || '', 1)
			const key = query.required === '0' ? `${query.name}?` : query.name
			return `${comment}\n${formatTabSpace(1)}${key}: string`
		})
		.join()}\n}`
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
	node.type =
		typeof node.type === 'string'
			? (node.type.toLowerCase() as `${YapiDataType}`)
			: ('string' as `${YapiDataType}`)

	if (isBasicType(node.type)) {
		return YapiTypeMapBasicTsType[node.type] || 'any'
	}

	if (YapiDataType.Object === node.type) {
		if (!node.properties) {
			return '{}'
		}

		return `{${Object.keys(node.properties).map((prop) => {
			const value = node.properties[prop]
			const comment = formatComment(value.description, tabCount + 1)
			const key = (value.required || node.required)?.includes(prop)
				? encodeKey(prop)
				: `${encodeKey(prop)}?`

			return `${comment}\n${formatTabSpace(tabCount + 1)}${key}: ${getTypeNode(
				value,
				tabCount + 1,
				true
			)}`
		})}\n${formatTabSpace(tabCount)}}`
	}

	if (YapiDataType.Array === node.type) {
		return (
			getTypeNode(node.items, tabCount + (hadAddTabCount ? 0 : 1)) +
			YapiTypeMapTsType[YapiDataType.Array]
		)
	}
	return ''
}

function getFormTypeNode(
	reqFormBody: {
		required: '0' | '1'
		_id: string
		name: string
		type: YapiDataType
		example: string
		desc: string
	}[]
) {
	if (!reqFormBody) {
		return ''
	}

	return `{${reqFormBody.map((item) => {
		const comment = formatComment(item.desc, 1)
		const key = item.required === '0' ? `${item.name}?` : item.name
		return `${comment}\n${formatTabSpace(1)}${key}: ${
			YapiTypeMapTsType[item.type]
		}`
	})}}`

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
	const typeNameData = getTypeNameData(typeName, resBody.type, suffix)

	const result = `export ${typeNameData.type} ${
		typeNameData.name
	} ${getTypeNode(resBody)}`

	return result
}
/**
 * @description FORM POST请求体转化typescript interface
 */
export function resFormBody2type(
	typeName: string,
	resBody: any[],
	suffix = 'ResBody'
) {
	const typeNameData = getTypeNameData(typeName, 'object', suffix)

	const result = `export ${typeNameData.type} ${
		typeNameData.name
	} ${getFormTypeNode(resBody)}`

	return result
}

export function getTypeNameData(
	typeName: string,
	type: AllTypeNode['type'],
	suffix = 'ResData'
): {
	/** typeName */
	name: string
	/** interface | type */
	type: string
} {
	try {
		const typeLowerCase = type.toLowerCase() as `${YapiDataType}`

		const typeNameContent = `${firstCharUpperCase(typeName, suffix)}`

		if (isBasicType(typeLowerCase) || typeLowerCase === YapiDataType.Array) {
			return {
				name: typeNameContent,
				type: 'type'
			}
		}

		return {
			name: `I${typeNameContent}`,
			type: 'interface'
		}
	} catch (error) {
		return {
			name: typeName,
			type: 'interface'
		}
	}
}

export function resBodySubProp2type(
	typeName: string,
	resBody: AllTypeNode,
	suffix = 'ResData'
) {
	try {
		const typeNameData = getTypeNameData(typeName, resBody.type, suffix)

		const typeNode = getTypeNode(resBody)

		return `export ${typeNameData.type} ${typeNameData.name}${
			typeNameData.type === 'type' ? ' = ' : ' '
		}${typeNode}`
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
 * @description FROM POST响应体转化typescript interface
 */
export function reqFormBody2type(typeName: string, reqBody: ReqBody) {
	return resBody2type(typeName, reqBody, 'ReqBody')
}
