import { DetailData } from '../utils/yapi2type/type'
import { YAPI_DEFAULT_SERVER_URL } from './yapi'

export const CONFIG_FILE_NAME = 'yapi-to-code.config.cjs'

export enum YAPI_RESPONSE_TYPE {
	RETURN = 'return',
	GENERIC = 'methodGeneric'
}

/** 生成 res 包含的属性，默认 all, 可指定为 data */
export enum ResponseKeyEnum {
	/** 返回所有属性 */
	ALL = 'all',
	/** 仅返回 data 属性 */
	DATA = 'data'
}

/** resType 放置的位置 是外层的 Promise<T> 还是作为请求方法的泛型 */
export enum ResponseTypePositionEnum {
	/** 类型将会放置在外层函数：Promise<T> */
	OUTER_FUNCTION = 'outerFunction',
	/** 类型将会放置在请求方法的泛型中：post<T> */
	FETCH_METHOD_GENERIC = 'fetchMethodGeneric'
}

export enum ConfigKeyEnum {
	HOST = 'host',
	RESPONSE_KEY = 'responseKey',
	RESPONSE_TYPE_POSITION = 'responseTypePosition',
	GEN_REQUEST = 'genRequest'
}

export interface IConfig {
	[ConfigKeyEnum.HOST]: string
	[ConfigKeyEnum.RESPONSE_KEY]: `${ResponseKeyEnum}`
	[ConfigKeyEnum.RESPONSE_TYPE_POSITION]: `${ResponseTypePositionEnum}`
	genRequest?(
		formData: {
			comment: string
			fnName: string
			IReqTypeName: string
			IResTypeName: string
			requestFnName: string
			apiPath: string
		},
		data: DetailData
	): string
}

export const DEFAULT_CONFIG: IConfig = {
	[ConfigKeyEnum.HOST]: YAPI_DEFAULT_SERVER_URL,
	[ConfigKeyEnum.RESPONSE_KEY]: ResponseKeyEnum.ALL,
	[ConfigKeyEnum.RESPONSE_TYPE_POSITION]:
		ResponseTypePositionEnum.OUTER_FUNCTION
}

export const YAPI_RESPONSE_NAME = 'YapiResponse'

export const genConfigTemplate = (config: IConfig = DEFAULT_CONFIG) => {
	return `module.exports = () => {
	return {
		// 域名：优先取工作区缓存的域名(登录时填写的域名)
		// host: 'https://yapi.pro',
		// resType 放置的位置 是外层的 Promise<T> 还是作为请求方法的泛型
		// 'outerFunction' | 'fetchMethodGeneric'
		responseTypePosition: '${config.responseTypePosition}',
		// 生成 res 包含的属性，默认 all, 可指定为 data
		responseKey: '${config.responseKey}',
		// 自定义生成 request 方法
		genRequest(
			{
				comment,
				fnName,
				IReqTypeName,
				IResTypeName,
				requestFnName,
				apiPath,
			},
			data
		) {
			return (
				\`\\n\${comment}\\n\` +
				\`export async function \${fnName}(params: I\${IReqTypeName}) {
					return request.\${requestFnName}<\${IResTypeName}>('\${apiPath}', params)
				}\`
			)
		}
	}
}`
}
