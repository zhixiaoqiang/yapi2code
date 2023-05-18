import { DetailData } from '../utils/yapi2type/type'

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
	RESPONSE_KEY = 'responseKey',
	RESPONSE_TYPE_POSITION = 'responseTypePosition',
	GEN_REQUEST = 'genRequest'
}

export interface IConfig {
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
	[ConfigKeyEnum.RESPONSE_KEY]: ResponseKeyEnum.ALL,
	[ConfigKeyEnum.RESPONSE_TYPE_POSITION]:
		ResponseTypePositionEnum.OUTER_FUNCTION
}

export const YAPI_RESPONSE_NAME = 'YapiResponse'
