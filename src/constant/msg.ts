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
	LOGIN_BY_LDAP = 'LOGIN_BY_LDAP',
	/** 初始配置 */
	INIT_CONFIG = 'INIT_CONFIG'
}

// 主消息类型 用于客户端和服务器通信
export const MAIN_MSG = 'MAIN_MSG'
// 未定义API的类型
export const API_NOT_DEFINED = 'NOT_TYPE'
