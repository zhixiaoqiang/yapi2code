/**
 * yapi生成类型 相关配置信息
 */

const yapiTypeConfig = {
  isUseTab: false,
  updateUseTab(useTab?: boolean) {
    this.isUseTab = !!useTab
  },
}

export { yapiTypeConfig }

export const TYPE_SUFFIX = {
  ReqBody: 'ReqBody',
  ReqQuery: 'ReqQuery',
  ResBody: 'ResBody',
  ResQuery: 'ResQuery',
}
