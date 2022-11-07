import {
	firstCharUpperCase,
	reqQuery2type,
	reqBody2type,
	resBody2type,
	formatTabSpace,
	resBodyData2type,
	parseJson
} from './json2type'

import { StorageType } from '../../constant'
import storage from '../../utils/storage'

import type { DetailData } from './type'

/**
 * @description 获取名称
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

export const genRequest = (data: DetailData) => {
	const paths = data?.path?.split(/[/.]/g) || []
	const lastWord = paths[paths.length - 1]

	const interfaceName = getApiName(data)

	const suffixMap: Record<string, string> = {
		GET: 'ReqQuery',
		POST: 'ReqBody'
	}

	return (
		`\n/**
  * @description ${data.title}
  * @url ${getApiUrl(data)}
  */\n` +
		`export async function ${lastWord}(params: I${firstCharUpperCase(
			interfaceName
		)}${suffixMap[data.method] || ''}): Promise<I${firstCharUpperCase(
			interfaceName
		)}ResBody> {
	return request.${data.method.toLowerCase()}('${data?.path}', params)
}`
	)
}

/**
 *
 */
export const getApiUrl = (data: DetailData) => {
	return (
		storage.getStorage(StorageType.SERVER_URL) +
		`/project/${data.project_id}/interface/api/${data._id}`
	)
}
/**
 * @description 数据转类型
 */
export function data2Type(data: DetailData) {
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

	const requestContent = genRequest(data)

	const wholeNamespace = `/**\n * @description ${
		data.title
	}\n * @url ${getApiUrl(data)}\n */\nexport namespace Yapi${firstCharUpperCase(
		interfaceName
	)}{\n${reqQueryType && '$1'}
    ${reqBodyType && '$2'}
    ${resBodyType && '$3'}
  \n}\n`

	return {
		reqQueryType,
		reqBodyType,
		resBodyType,
		resBodyDataType,
		requestContent,
		reqQueryTitleUnderNamespace: 'ReqQuery',
		reqQueryTitle: firstCharUpperCase(interfaceName) + 'ReqQuery',
		reqBodyTitleUnderNamespace: 'ReqBody',
		reqBodyTitle: firstCharUpperCase(interfaceName) + 'ReqBody',
		resBodyTitleUnderNamespace: 'ResBody',
		resBodyTitle: firstCharUpperCase(interfaceName) + 'ResBody',
		resBodyDataTitleUnderNamespace: 'ResBodyData',
		resBodyDataTitle: firstCharUpperCase(interfaceName) + 'ResBodyData',
		namespaceTitle: `Yapi${firstCharUpperCase(interfaceName)}`,
		/** 命名空间，对上面生成的类型进行切割重组 */
		wholeNamespace: wholeNamespace
			.replace(
				'$1',
				reqQueryType
					.replace(firstCharUpperCase(interfaceName), '')
					.split('\n')
					.join(`\n${formatTabSpace(1)}`)
			)
			.replace(
				'$2',
				reqBodyType
					.replace(firstCharUpperCase(interfaceName), '')
					.split('\n')
					.join(`\n${formatTabSpace(1)}`)
			)
			.replace(
				'$3',
				resBodyType
					.replace(firstCharUpperCase(interfaceName), '')
					.split('\n')
					.join(`\n${formatTabSpace(1)}`)
			)
	}
}
