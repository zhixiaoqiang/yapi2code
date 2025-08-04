import type { AllTypeNode, ReqBodyType, ReqQuery } from './type'
import { formatComment, formatTabSpace } from './format'
import { YapiDataTypeEnum, YapiTypeMapBasicTsType, YapiTypeMapTsType } from './type'
import { encodeKey, firstCharUpperCase, isBasicType } from './utils'

/**
 * 获取类型名称：IxxxResData
 */
export function getTypeNameData(
  typeName: string,
  type: AllTypeNode['type'],
  suffix = 'ResData',
): {
  /** typeName */
  name: string
  /** interface | type */
  type: string
} {
  const typeNameContent = `${firstCharUpperCase(typeName, suffix || 'ResData')}`

  try {
    const typeLowerCase = type.toLowerCase() as `${YapiDataTypeEnum}`
    if (isBasicType(typeLowerCase) || typeLowerCase === YapiDataTypeEnum.Array) {
      return {
        name: typeNameContent,
        type: 'type',
      }
    }

    return {
      name: `I${typeNameContent}`,
      type: 'interface',
    }
  }
  catch (error) {
    return {
      name: typeNameContent,
      type: 'interface',
    }
  }
}

/**
 * 根据节点类型内容, 基础类型直接返回, 复杂类型递归处理，都不属于则返回 unknown
 * @param node
 * @param tabCount
 * @param hadAddTabCount
 * @returns
 */
function getTypeNodeContent(
  node: AllTypeNode,
  tabCount = 0,
  hadAddTabCount = false,
): string {
  node.type
		= typeof node.type === 'string'
      ? (node.type.toLowerCase() as `${YapiDataTypeEnum}`)
      : YapiDataTypeEnum.String

  switch (node.type) {
    case YapiDataTypeEnum.Object: {
      if (!node.properties)
        return '{}'

      return `{${Object.entries(node.properties).map(([prop, value]) => {
        const comment = formatComment(value.description, tabCount + 1)

        const isRequired = !!(value.required?.includes(prop) || node.required?.includes(prop))
        const key = encodeKey(prop)

        return `${comment}\n${formatTabSpace(tabCount + 1)}${key}${isRequired ? '' : '?'}: ${getTypeNodeContent(
          value,
          tabCount + 1,
          true,
        )}`
      })}\n${formatTabSpace(tabCount)}}`
    }
    case YapiDataTypeEnum.Array:
      return `${getTypeNodeContent(node.items, tabCount + (hadAddTabCount ? 0 : 1))}${YapiTypeMapTsType[YapiDataTypeEnum.Array]}`
    default: {
      if (!isBasicType(node.type))
        return 'unknown'

      return YapiTypeMapBasicTsType[node.type]
    }
  }
}

/**
 * @description GET请求参数转化typescript interface
 */
export function genReqQueryTypeContent(typeName: string, queryList: ReqQuery) {
  const typeNameData = getTypeNameData(
    typeName,
    YapiDataTypeEnum.Object,
    'ReqQuery',
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
 * @description FROM POST请求体转化typescript interface
 * @param reqFormBody
 * @returns
 */
function getFormTypeNode(
  reqFormBody: {
    required: '0' | '1'
    _id: string
    name: string
    type: YapiDataTypeEnum
    example: string
    desc: string
  }[],
) {
  if (!reqFormBody) {
    return ''
  }

  return `{${reqFormBody.map((item) => {
    const comment = formatComment(item.desc, 1)
    const key = item.required === '0' ? `${item.name}?` : item.name
    return `${comment}\n${formatTabSpace(1)}${key}: ${YapiTypeMapTsType[item.type]
    }`
  })}}`
}

/**
 * @description FORM POST请求体转化typescript interface
 */
export function genReqFormBodyTypeContent(
  typeName: string,
  resBody: any[],
  suffix = 'ReqBody',
) {
  const typeNameData = getTypeNameData(typeName, 'object', suffix)

  const result = `export ${typeNameData.type} ${typeNameData.name
  }${typeNameData.type === 'type' ? ' = ' : ' '}${getFormTypeNode(resBody)}`

  return result
}

/**
 * @description POST响应体转化typescript interface
 */
export function genResBodyTypeContent(
  typeName: string,
  resBody: AllTypeNode,
  suffix = 'ResBody',
) {
  const typeNameData = getTypeNameData(typeName, resBody.type, suffix)

  const result = `export ${typeNameData.type} ${typeNameData.name
  }${typeNameData.type === 'type' ? ' = ' : ' '}${getTypeNodeContent(resBody)}`

  return result
}

export function genResBodySubPropTypeContent(
  typeName: string,
  resBody: AllTypeNode,
  suffix = 'ResData',
) {
  try {
    const typeNameData = getTypeNameData(typeName, resBody.type, suffix)

    const typeNode = getTypeNodeContent(resBody)

    return `export ${typeNameData.type} ${typeNameData.name}${typeNameData.type === 'type' ? ' = ' : ' '
    }${typeNode}`
  }
  catch (error) {
    return ''
  }
}
/**
 * @description POST请求体转化typescript interface
 */
export function genReqBodyTypeContent(typeName: string, reqBody: ReqBodyType) {
  return genResBodyTypeContent(typeName, reqBody, 'ReqBody')
}

/**
 * @description FROM POST请求体转化typescript interface
 */
// export function genReqFormBodyTypeContent(typeName: string, reqBody: ReqBodyType) {
// 	return genResBodyTypeContent(typeName, reqBody, 'ReqBody')
// }
