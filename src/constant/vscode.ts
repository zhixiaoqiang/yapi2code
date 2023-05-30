/** 命令类型 */
export enum Command {
	/** 消息弹窗 */
	WARN_TOAST = 'WARN_TOAST',
	/** 跳转 github */
	GITHUB = 'yapi.github',
	/** 退出登录 */
	LOGOUT = 'yapi.logout',
	/** 配置 */
	CONFIGURATION = 'yapi.configuration',
	/** 设置-预览完整配置项 */
	CONFIGURATION_PREVIEW = 'yapi.configuration-preview',
	/** 刷新接口 */
	REFRESH = 'yapi.refresh',
	/** 注入类型 */
	INSERT_TYPE = 'yapi.insert.type',
	/** 修复所有类型 */
	FIX_ALL = 'yapi.fixall'
}

export enum SideBarView { // 左侧栏
	YAPI_VIEW = 'yapi.view'
}

export enum ContextEnum { // 上下文
	SHOW_TREE_VIEW = 'tree.view.show'
}
