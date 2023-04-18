import { DetailData } from './utils/yapi2type/type'

export const CONFIG_PREFIX_NAME = 'yapi-to-code.config.cjs'

export enum Command {
	WARN_TOAST = 'WARN_TOAST',
	GITHUB = 'yapi.github',
	LOGOUT = 'yapi.logout',
	REFRESH = 'yapi.refresh',
	INSERT_TYPE = 'yapi.insert.type', // 注入类型
	FIX_ALL = 'yapi.fixall' // 修复所有
}
/** 消息类型 */
export enum MsgType {
	/** slidebar和vscode通信 */
	COMMAND = 'COMMAND',
	LOGIN_STATUS = 'LOGIN_STATUS',
	LOGIN_NOW = 'LOGIN_NOW',
	FETCH_GROUP = 'FETCH_GROUP',
	FETCH_PROJECT = 'FETCH_PROJECT',
	FETCH_DIR = 'FETCH_DIR',
	FETCH_DIR_AND_ITEM = 'FETCH_DIR_AND_ITEM',
	FETCH_ITEM = 'FETCH_ITEM',
	FETCH_DETAIL = 'FETCH_DETAIL',
	WEBVIEW_DONE = 'WEBVIEW_DONE',
	SERVER_URL = 'SERVER_URL',
	FRESH_DATA = 'FRESH_DATA',
	/** panel和vscode通信 */
	PANEL_KEY_CHANGE = 'PANEL_KEY_CHANGE',
	FETCH_CURRENT_KEY = 'FETCH_CURRENT_KEY',
	/** LSP和client通信 */
	FIX_ALL = 'FIX_ALL',
	/** 获取API文件 */
	API_FILE_HANDLER = 'API_FILE_HANDLER',
	/** 导航到文件 */
	OPEN_FILE = 'OPEN_FILE',
	LSP_DONE = 'LSP_DONE',
	LOGIN_BY_LDAP = 'LOGIN_BY_LDAP'
}

export enum SideBarView { // 左侧栏
	YAPI_VIEW = 'yapi.view'
}

export enum ContextEnum { // 上下文
	SHOW_TREE_VIEW = 'tree.view.show'
}

export enum StorageType { // 储存类型
	USER_INFO = 'userInfo',
	LOGIN_INFO = 'loginInfo',
	COOKIE = 'cookie',
	DATA_GROUP = 'DATA_GROUP',
	DATA_PROJECT = 'DATA_PROJECT',
	DATA_DIR = 'DATA_DIR',
	DATA_DIR_AND_ITEM = 'DATA_DIR_AND_ITEM',
	DATA_ITEM = 'DATA_ITEM',
	SERVER_URL = 'SERVER_URL',
	API_DETAIL = 'API_DETAIL',
	LOGIN_STAMP = 'LOGIN_STAMP',
	LAST_CHECKVERSION_STAMP = 'LAST_CHECKVERSION_STAMP', // 上次检查更新的时间
	WEBVIEW_DONE = 'WEBVIEW_DONE',
	API_TYPE_LIST = 'API_TYPE_LIST',
	LOGIN_BY_LDAP = 'LOGIN_BY_LDAP',
	WORKSPACE_CONFIG = 'WORKSPACE_CONFIG'
}

export const GIT_REMOTE_URL = 'https://github.com/zhixiaoqiang/yapi2code'

export const YAPI_RESPONSE_NAME = 'YapiResponse'

export const YAPI_DEFAULT_SERVER_URL = 'http://yapi.internal.weimob.com'

export const LOGIN_BY_LDAP = true

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
