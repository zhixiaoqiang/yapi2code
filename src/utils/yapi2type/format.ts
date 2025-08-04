import { yapiTypeConfig } from './config'

/**
 * @description 格式化tab
 */
export function formatTabSpace(tabCount: number) {
  return (yapiTypeConfig.isUseTab ? '	' : '  ').repeat(tabCount)
}

/**
 * @description 格式化注释
 */
export function formatComment(comment: string | undefined, tabCount = 0) {
  if (!comment || !comment?.trim())
    return ''
  return `\n${formatTabSpace(tabCount)}/** ${comment} */`
}
