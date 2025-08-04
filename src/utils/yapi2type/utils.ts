import type { YapiDataTypeEnum, YapiDetailResData, YapiTypeMapBasicTsType } from './type'
import { AllStorageType } from '@/constant/storage'
import storage from '../storage'
import { YapiBasicTypeMap } from './type'

/**
 * @description key转义
 */
export function encodeKey(key: string) {
  return encodeURIComponent(key) === key ? key : `"${key}"`
}

/**
 * 解析JSON, 包含解析非标准的 json, e.g.: "{a:1}"
 * @param content 内容
 * @returns 对象
 */
export function parseJson(content: string) {
  if (!content) {
    return {}
  }

  function convertStringToObj(str: string) {
    let obj
    eval(`obj =${str}`)
    return obj
  }

  try {
    const data = JSON.parse(content)
    return typeof data === 'string' ? convertStringToObj(content) : data
  }
  catch (error) {
    return convertStringToObj(content)
  }
}

/**
 * @description 是否基础类型
 */
export function isBasicType(
  type: `${YapiDataTypeEnum}`,
): type is keyof typeof YapiTypeMapBasicTsType {
  return type in YapiBasicTypeMap
}

/**
 * @description 首字母大写，可以拼接后缀
 */
export function firstCharUpperCase(word: string, suffix = '') {
  if (!word) {
    return ''
  }
  return word[0].toUpperCase() + word.slice(1) + suffix
}

/** 连接符转大写 */
export function replaceHyphenToUpperCase(str: string) {
  return str.replace(/(-|_)([a-z])/g, g => g[1].toUpperCase())
}

// 为什么格式化时间不用dayjs/moment? dayjs在打包环境会报错，不知道什么原因
/**
 * @description 格式化数字2位，0填充
 */
function format2num(num: number | string) {
  const strNum = num.toString()
  return strNum.length === 1 ? `0${strNum}` : strNum
}
/**
 * @description 格式化时间
 */
export function formatTime(stamp: number) {
  const date = new Date(stamp * 1e3)
  return `${date.getFullYear()}-${format2num(date.getMonth() + 1)}-${format2num(
    date.getDate(),
  )} ${format2num(date.getHours())}:${format2num(
    date.getMinutes(),
  )}:${format2num(date.getSeconds())}`
}

/**
 * @description 获取接口的url
 * @param data
 * @returns
 */
export function getApiUrl(data: YapiDetailResData) {
  return (
    `${storage.getStorage(AllStorageType.SERVER_URL)
    }/project/${data.project_id}/interface/api/${data._id}`
  )
}

/**
 * 格式化类型注释
 * @param data
 * @param subName
 * @returns
 */
export function formatTypeComment(data: YapiDetailResData, subName: string) {
  return `/**
 * @description ${data.title}-${subName}
 * @url ${getApiUrl(data)}
 * @updateDate ${formatTime(data.up_time)}
 */`
}

export function formatDubboTips(data: YapiDetailResData) {
  return formatErrorTips(data, '接口为：DUBBO')
}

export function formatErrorTips(data: YapiDetailResData, decs = '') {
  return `/**
 * ${decs}，暂时无法生成类型
 * 详情点击：${getApiUrl(data)}
*/\n`
}
