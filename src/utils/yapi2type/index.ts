import type {
  IConfig,
  IRequestFormData,
} from '../../constant/config'
import type { AllTypeNode, YapiDetailResData } from './type'

import {
  ResponseKeyEnum,
  ResponseTypePositionEnum,
} from '../../constant/config'
import { yapiTypeConfig } from './config'
import {
  genReqBodyTypeContent,
  genReqFormBodyTypeContent,
  genReqQueryTypeContent,
  genResBodyTypeContent,
  getTypeNameData,
} from './json2type'
import { YapiDataTypeEnum } from './type'
import { firstCharUpperCase, formatTypeComment, getApiUrl, parseJson, replaceHyphenToUpperCase } from './utils'

/**
 * @description 获取请求函数名
 */
function getRequestFnName(data: YapiDetailResData) {
  const paths = data?.path?.split(/[/.]/g) || []
  // word 可能会包含连接符，需要转换成驼峰
  const lastWord = replaceHyphenToUpperCase(paths[paths.length - 1])
  const preLastWord = replaceHyphenToUpperCase(paths[paths.length - 2])
  return preLastWord + firstCharUpperCase(lastWord)
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

function genRequest(data: YapiDetailResData,	options: genRequestOptionsType) {
  const {
    fnName,
    dataType,
    responseTypePosition,
    typeNameSuffix,
    hasReqType,
    hasResType,
  } = options
  const { name: IResTypeName } = getTypeNameData(
    fnName,
    dataType,
    typeNameSuffix,
  )

  const { name: IReqTypeName } = getTypeNameData(
    fnName,
    YapiDataTypeEnum.Object,
    (data.req_body_other || !!data.req_body_form?.length) ? 'ReqBody' : 'ReqQuery',
  )

  const contentMap: IRequestFormData = {
    comment: `/**
 * @description ${data.title}
 * @url ${getApiUrl(data)}
 */`,
    fnName,
    IReqTypeName,
    IResTypeName,
    requestMethod: data.method.toLowerCase(),
    requestFnName: data.method.toLowerCase(),
    apiPath: data?.path,
  }

  if (options.genRequest) {
    return options.genRequest(contentMap, data)
  }

  const paramsContent = hasReqType ? `params: ${contentMap.IReqTypeName}` : ''

  const renderOuterFunctionType
		= hasResType
		  && responseTypePosition !== ResponseTypePositionEnum.FETCH_METHOD_GENERIC
		  ? `: Promise<${contentMap.IResTypeName}>`
		  : ''

  const renderGenericType
		= hasResType
		  && responseTypePosition === ResponseTypePositionEnum.FETCH_METHOD_GENERIC
		  ? `<${contentMap.IResTypeName}>`
		  : ''

  const requestInstance = `request.${contentMap.requestMethod}`

  return (
    `${contentMap.comment}\n`
    + `export async function ${contentMap.fnName
    }(${paramsContent})${renderOuterFunctionType} {
	return ${requestInstance}${renderGenericType}('${contentMap.apiPath}'${hasReqType ? ', params' : ''
    })
}`
  )
}

/**
 * @description 数据转类型
 */
export function data2Type(data: YapiDetailResData, config?: IConfig) {
  const { responseKey, responseCustomKey, useTab } = config || {}
  yapiTypeConfig.updateUseTab(useTab)
  const requestFnName = getRequestFnName(data)

  const reqQueryTypeContent = data?.req_query?.length
    ? `${formatTypeComment(data, '请求参数')}\n${genReqQueryTypeContent(
      requestFnName,
      data.req_query,
    )}`
    : ''

  const reqBodyTypeContent = data.req_body_other
    ? `${formatTypeComment(data, '请求体')}\n${genReqBodyTypeContent(
      requestFnName,
      parseJson(data.req_body_other),
    )}`
    : ''

  const reqBodyFormTypeContent = data.req_body_form?.length
    ? `${formatTypeComment(data, '请求体')}\n${genReqFormBodyTypeContent(
      requestFnName,
      data.req_body_form,
    )}`
    : ''

  const parseResBody = parseJson(data.res_body)
  const resBodyTypeContent = data.res_body
    ? `${formatTypeComment(data, '响应体')}\n${genResBodyTypeContent(
      requestFnName,
      parseResBody,
    )}`
    : ''

  const customResDataKey = responseKey && [ResponseKeyEnum.DATA,	ResponseKeyEnum.CUSTOM].includes(responseKey)

  let dataType = parseResBody?.type || 'object'
  let resBodyDataTypeContent = ''

  if (customResDataKey) {
    // 获取嵌套数据
    const getNestData = (data: Record<string, any>, str: string) => {
      return str.split('.').reduce((prev, curr) => {
        prev = prev?.properties?.[curr]
        return prev
      }, data) as AllTypeNode
    }

    /** 配置的返回对象数据 */
    const configReturnDataKey
			= customResDataKey && ResponseKeyEnum.DATA === responseKey
			  ? responseKey
			  : responseCustomKey || ResponseKeyEnum.DATA

    resBodyDataTypeContent = getNestData(parseResBody, configReturnDataKey)
      ? `${formatTypeComment(data, '响应体')}\n${genResBodyTypeContent(
        requestFnName,
        getNestData(parseResBody, configReturnDataKey),
        'ResData',
      )}`
      : ''

    dataType = getNestData(parseResBody, configReturnDataKey).type
  }

  const resDataTypeContent = customResDataKey ? resBodyDataTypeContent : resBodyTypeContent

  const requestContent = genRequest(data, {
    fnName: requestFnName,
    dataType,
    hasReqType: !!(reqQueryTypeContent || reqBodyTypeContent || reqBodyFormTypeContent),
    hasResType: !!resDataTypeContent,
    typeNameSuffix: customResDataKey ? 'ResData' : 'ResBody',
    ...config,
  })

  return {
    reqQueryTypeContent,
    reqBodyTypeContent: reqBodyTypeContent || reqBodyFormTypeContent,
    resBodyTypeContent,
    resBodyDataTypeContent,
    resDataTypeContent,
    requestContent,
    reqQueryTitle: firstCharUpperCase(requestFnName, 'ReqQuery'),
    reqBodyTitle: firstCharUpperCase(requestFnName, 'ReqBody'),
    resBodyTitle: firstCharUpperCase(requestFnName, 'ResBody'),
    resBodyDataTitle: firstCharUpperCase(requestFnName, 'ResData'),
  }
}
