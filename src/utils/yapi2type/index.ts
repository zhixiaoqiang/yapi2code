import {
	firstCharUpperCase,
	reqQuery2type,
	reqBody2type,
	resBody2type,
	getTypeNameData,
	resBodySubProp2type,
	AllTypeNode,
	updateUseTab
} from './json2type'

import storage from '../../utils/storage'

import {
	ResponseKeyEnum,
	ResponseTypePositionEnum,
	IConfig
} from '../../constant/config'
import { AllStorageType } from '../../constant/storage'
import { parseJson } from './utils'
import type { DetailData } from './type'

/**
 * @description 获取接口名称
 */
const getApiName = (data: DetailData) => {
	const paths = data?.path?.split(/[/.]/g) || []
	const lastWord = paths[paths.length - 1]
	const preLastWord = paths[paths.length - 2]
	return preLastWord + firstCharUpperCase(lastWord)
}

// 为什么格式化时间不用dayjs/moment? dayjs在打包环境会报错，不知道什么原因
/**
 * @description 格式化数字2位，0填充
 */
const format2num = (num: number | string) => {
	const strNum = num.toString()
	return strNum.length === 1 ? '0' + strNum : strNum
}
/**
 * @description 格式化时间
 */
const formatTime = (stamp: number) => {
	const date = new Date(stamp * 1e3)
	return `${date.getFullYear()}-${format2num(date.getMonth() + 1)}-${format2num(
		date.getDate()
	)} ${format2num(date.getHours())}:${format2num(
		date.getMinutes()
	)}:${format2num(date.getSeconds())}`
}
/**
 * @description 格式化顶部的注释说明
 */
const formatInterfaceComment = (data: DetailData, subName: string) => {
	return `/**
  * @description ${data.title}-${subName}
  * @url ${getApiUrl(data)}
  * @updateDate ${formatTime(data.up_time)}
  */`
}

export const formatDubboTips = (data: DetailData) => {
	return formatBaseTips(data, '接口为：DUBBO')
}

export const formatBaseTips = (data: DetailData, decs = '') => {
	return `/**
  * ${decs}，暂时无法生成类型
	* 详情点击：${getApiUrl(data)}
*/\n`
}

type genRequestOptionsType = {
	/** 接口名称 */
	fnName: string
	/** 是否有响应类型 */
	hasResType?: boolean
	/** 是否有请求类型 */
	hasReqType?: boolean
	/** 类型名称后缀 */
	typeNameSuffix: string
	/** 结构数据类型，决定返回 interface 还是 type */
	dataType: AllTypeNode['type']
} & Partial<IConfig>

export const genRequest = (
	data: DetailData,
	options: genRequestOptionsType
) => {
	const suffixMap: Record<string, string> = {
		GET: 'ReqQuery',
		POST: 'ReqBody'
	}
	const {
		fnName,
		dataType,
		responseTypePosition,
		typeNameSuffix,
		hasReqType,
		hasResType
	} = options
	const { name: resTypeName } = getTypeNameData(
		fnName,
		dataType,
		typeNameSuffix
	)

	const contentMap = {
		comment: `/**
	* @description ${data.title}
	* @url ${getApiUrl(data)}
	*/`,
		fnName,
		IReqTypeName: `I${firstCharUpperCase(
			fnName,
			suffixMap[data.method] || ''
		)}`,
		IResTypeName: resTypeName,
		requestFnName: data.method.toLowerCase(),
		apiPath: data?.path
	}

	if (options.genRequest) {
		return options.genRequest(contentMap, data)
	}

	const paramsContent = hasReqType ? 'params: ' + contentMap.IReqTypeName : ''

	const renderOuterFunctionType =
		hasResType &&
		responseTypePosition !== ResponseTypePositionEnum.FETCH_METHOD_GENERIC
			? `: Promise<${contentMap.IResTypeName}>`
			: ''

	const renderGenericType =
		hasResType &&
		responseTypePosition === ResponseTypePositionEnum.FETCH_METHOD_GENERIC
			? `<${contentMap.IResTypeName}>`
			: ''

	const requestInstance = `request.${contentMap.requestFnName}`

	return (
		`${contentMap.comment}\n` +
		`export async function ${
			contentMap.fnName
		}(${paramsContent})${renderOuterFunctionType} {
	return ${requestInstance}${renderGenericType}('${contentMap.apiPath}'${
		hasReqType ? ', params' : ''
	})
}`
	)
}

export const getApiUrl = (data: DetailData) => {
	return (
		storage.getStorage(AllStorageType.SERVER_URL) +
		`/project/${data.project_id}/interface/api/${data._id}`
	)
}
/**
 * @description 数据转类型
 */
export function data2Type(data: DetailData, config?: IConfig) {
	const { responseKey, responseCustomKey, useTab } = config || {}
	updateUseTab(useTab)
	const interfaceName = getApiName(data)
	const reqQueryType = data?.req_query?.length
		? `${formatInterfaceComment(data, 'query请求参数')}\n${reqQuery2type(
				interfaceName,
				data.req_query
		  )}`
		: ''
	const reqBodyType = data.req_body_other
		? `${formatInterfaceComment(data, 'post请求体')}\n${reqBody2type(
				interfaceName,
				parseJson(data.req_body_other)
		  )}`
		: ''

	const parseResBody = parseJson(data.res_body)
	const resBodyType = data.res_body
		? `${formatInterfaceComment(data, '响应体')}\n${resBody2type(
				interfaceName,
				parseResBody
		  )}`
		: ''

	const isReturnResDataProp =
		ResponseKeyEnum.DATA === responseKey ||
		ResponseKeyEnum.CUSTOM === responseKey

	const getNestData = (data: Record<string, any>, str: string) => {
		return str.split('.').reduce((prev, curr) => {
			prev = prev['properties'][curr]
			return prev
		}, data) as AllTypeNode
	}

	const dataKey =
		isReturnResDataProp && ResponseKeyEnum.DATA === responseKey
			? responseKey
			: responseCustomKey || 'data'

	const resBodyDataType = getNestData(parseResBody, dataKey)
		? `${formatInterfaceComment(data, '响应体')}\n${resBodySubProp2type(
				interfaceName,
				getNestData(parseResBody, dataKey)
		  )}`
		: ''

	const resType = isReturnResDataProp ? resBodyDataType : resBodyType

	const requestContent = genRequest(data, {
		fnName: interfaceName,
		dataType: isReturnResDataProp
			? getNestData(parseResBody, dataKey).type
			: parseResBody?.type,
		hasReqType: !!(reqQueryType || reqBodyType),
		hasResType: !!(reqBodyType || resBodyDataType),
		typeNameSuffix: isReturnResDataProp ? 'ResData' : 'ResBody',
		...config
	})

	return {
		reqQueryType,
		reqBodyType,
		resBodyType,
		resBodyDataType,
		resType,
		requestContent,
		reqQueryTitle: firstCharUpperCase(interfaceName, 'ReqQuery'),
		reqBodyTitle: firstCharUpperCase(interfaceName, 'ReqBody'),
		resBodyTitle: firstCharUpperCase(interfaceName, 'ResBody'),
		resBodyDataTitle: firstCharUpperCase(interfaceName, 'ResData')
	}
}
