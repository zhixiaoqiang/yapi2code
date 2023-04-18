import {
	firstCharUpperCase,
	reqQuery2type,
	reqBody2type,
	resBody2type,
	getTypeNameData,
	resBodyData2type,
	parseJson
} from './json2type'

import {
	IConfig,
	ResponseKeyEnum,
	ResponseTypePositionEnum,
	StorageType
} from '../../constant'
import storage from '../../utils/storage'

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
	return `\n/**
  * @description ${data.title}-${subName}
  * @url ${getApiUrl(data)}
  * @updateDate ${formatTime(data.up_time)}
  */\n`
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
	isReturnResDataProp?: boolean
	hasResType?: boolean
	hasReqType?: boolean
} & Partial<IConfig>

export const genRequest = (
	data: DetailData,
	options: genRequestOptionsType
) => {
	const paths = data?.path?.split(/[/.]/g) || []
	const lastWord = paths[paths.length - 1]

	const interfaceName = getApiName(data)

	const suffixMap: Record<string, string> = {
		GET: 'ReqQuery',
		POST: 'ReqBody'
	}
	const { responseTypePosition, isReturnResDataProp, hasReqType, hasResType } =
		options
	const { name: resTypeName } = getTypeNameData(
		interfaceName,
		isReturnResDataProp
			? parseJson(data.res_body)?.properties?.data
			: parseJson(data.res_body),
		isReturnResDataProp ? 'ResData' : 'ResBody'
	)

	const contentMap = {
		comment: `/**
	* @description ${data.title}
	* @url ${getApiUrl(data)}
	*/`,
		fnName: lastWord,
		IReqTypeName: `I${firstCharUpperCase(
			interfaceName,
			suffixMap[data.method] || ''
		)}`,
		IResTypeName: resTypeName,
		requestFnName: data.method.toLowerCase(),
		apiPath: data?.path
	}

	if (options.genRequest) {
		return options.genRequest(contentMap, data)
	}

	const renderOuterFunctionType =
		hasResType &&
		responseTypePosition !== ResponseTypePositionEnum.FETCH_METHOD_GENERIC
			? ': Promise<' + contentMap.IResTypeName + '>'
			: ''

	const renderFetchMethodGenericType =
		hasResType &&
		responseTypePosition === ResponseTypePositionEnum.FETCH_METHOD_GENERIC
			? '<' + contentMap.IResTypeName + '>'
			: ''

	return (
		`\n${contentMap.comment}\n` +
		`export async function ${contentMap.fnName}(params${
			hasReqType ? ': ' + contentMap.IReqTypeName : ''
		})${renderOuterFunctionType} {
	return request.${contentMap.requestFnName}${renderFetchMethodGenericType}('${
			contentMap.apiPath
		}', params)
}`
	)
}

export const getApiUrl = (data: DetailData) => {
	return (
		storage.getStorage(StorageType.SERVER_URL) +
		`/project/${data.project_id}/interface/api/${data._id}`
	)
}
/**
 * @description 数据转类型
 */
export function data2Type(data: DetailData, config: Partial<IConfig> = {}) {
	const { responseKey } = config

	const interfaceName = getApiName(data)
	const reqQueryType = data?.req_query?.length
		? formatInterfaceComment(data, 'query请求参数') +
		  reqQuery2type(interfaceName, data.req_query)
		: ''
	const reqBodyType = data.req_body_other
		? formatInterfaceComment(data, 'post请求体') +
		  reqBody2type(interfaceName, parseJson(data.req_body_other))
		: ''
	const resBodyType = data.res_body
		? formatInterfaceComment(data, '响应体') +
		  resBody2type(interfaceName, parseJson(data.res_body))
		: ''
	const resBodyDataType = data.res_body
		? formatInterfaceComment(data, '响应体') +
		  resBodyData2type(
				interfaceName,
				parseJson(data.res_body)?.properties?.data
		  )
		: ''
	const isReturnResDataProp = responseKey === ResponseKeyEnum.DATA

	const resType = isReturnResDataProp ? resBodyDataType : resBodyType

	const requestContent = genRequest(data, {
		isReturnResDataProp,
		hasReqType: !!(reqQueryType || reqBodyType),
		hasResType: !!(reqBodyType || resBodyDataType),
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
