import type { YapiDetailResData } from '../utils/yapi2type/type'
import { YAPI_DEFAULT_SERVER_URL } from './yapi'

export const CONFIG_FILE_NAME = 'yapi-to-code.config.cjs'

export enum YAPI_RESPONSE_TYPE {
  RETURN = 'return',
  GENERIC = 'methodGeneric',
}

/** 生成 res 包含的属性，默认 all, 可指定为 data */
export enum ResponseKeyEnum {
  /** 返回所有属性 */
  ALL = 'all',
  /** 仅返回 data 属性 */
  DATA = 'data',
  /** 自定义属性 */
  CUSTOM = 'custom',
}

/** resDataTypeContent 放置的位置 是外层的 Promise<T> 还是作为请求方法的泛型 */
export enum ResponseTypePositionEnum {
  /** 类型将会放置在外层函数：Promise<T> */
  OUTER_FUNCTION = 'outerFunction',
  /** 类型将会放置在请求方法的泛型中：post<T> */
  FETCH_METHOD_GENERIC = 'fetchMethodGeneric',
}

export enum ConfigKeyEnum {
  HOST = 'host',
  BANNER = 'banner',
  RESPONSE_KEY = 'responseKey',
  RESPONSE_CUSTOM_KEY = 'responseCustomKey',
  RESPONSE_TYPE_POSITION = 'responseTypePosition',
  GEN_REQUEST = 'genRequest',
  FORMAT = 'format',
  USE_TAB = 'useTab',
}

export interface IRequestFormData {
  comment: string
  fnName: string
  IReqTypeName: string
  IResTypeName: string
  requestMethod: string
  /** @deprecated 即将废弃，请使用 requestMethod */
  requestFnName: string
  apiPath: string
}

export interface IConfig {
  [ConfigKeyEnum.HOST]: string
  [ConfigKeyEnum.BANNER]?: string
  [ConfigKeyEnum.FORMAT]: boolean
  [ConfigKeyEnum.USE_TAB]: boolean
  [ConfigKeyEnum.RESPONSE_KEY]: ResponseKeyEnum
  [ConfigKeyEnum.RESPONSE_CUSTOM_KEY]: string
  [ConfigKeyEnum.RESPONSE_TYPE_POSITION]: `${ResponseTypePositionEnum}`
  genRequest?: (
    formData: IRequestFormData,
    data: YapiDetailResData
  ) => string
}

export const DEFAULT_CONFIG: IConfig = {
  [ConfigKeyEnum.HOST]: YAPI_DEFAULT_SERVER_URL,
  [ConfigKeyEnum.USE_TAB]: false,
  [ConfigKeyEnum.FORMAT]: false,
  [ConfigKeyEnum.RESPONSE_KEY]: ResponseKeyEnum.ALL,
  [ConfigKeyEnum.RESPONSE_CUSTOM_KEY]: ResponseKeyEnum.DATA,
  [ConfigKeyEnum.RESPONSE_TYPE_POSITION]:
		ResponseTypePositionEnum.OUTER_FUNCTION,
}

export const YAPI_RESPONSE_NAME = 'YapiResponse'

export function genConfigTemplate(config: IConfig = DEFAULT_CONFIG) {
  return `module.exports = () => {
	return {
		/** 域名：优先取工作区缓存的域名(登录成功的域名) */
		host: '${config.host}',
		/** banner 头部内容，可以填写导入的请求实例等 */
		banner: '${config.banner}',
		/** 生成 res 包含的属性，默认 all, 可指定为 data、custom
		 * 'all' | 'data' | 'custom'
		 */
		responseKey: '${config.responseKey}',
		/** 生成 res 指定的属性值，仅当 responseKey 选择 custom 是有效，默认 data, 可指定为任意 key(支持链式：data.result) */
		responseCustomKey: '${config.responseCustomKey}',
		/** resDataTypeContent 放置的位置是外层的 Promise<T> 还是作为请求方法的泛型 post<T>
		 * 'outerFunction' | 'fetchMethodGeneric'
		 */
		responseTypePosition: '${config.responseTypePosition}',
		/** 开启自动格式化 */
		format: ${config.format},
		/** 缩进使用 tab，或者 双空格 */
		useTab: ${config.useTab},
		/** 自定义生成 request 方法 */
		genRequest(
			{
				comment,
				fnName,
				IReqTypeName,
				IResTypeName,
				requestMethod,
				apiPath,
			},
			data
		) {
			return (
				\`\\n\${comment}\\n\` +
				\`export async function \${fnName}(params: I\${IReqTypeName}) {
					return request.\${requestMethod}<\${IResTypeName}>('\${apiPath}', params)
				}\`
			)
		}
	}
}`
}
