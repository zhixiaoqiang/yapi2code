import type {
  CodeAction,
  CodeActionParams,
  Diagnostic,
} from 'vscode-languageserver'
import type Dove from '../../utils/dove'

import type { ApiInterface } from './types'
import { readFile } from 'node:fs/promises'
import {
  CodeActionKind,
  DiagnosticSeverity,
} from 'vscode-languageserver'
import { YAPI_RESPONSE_NAME } from '../../constant/config'
import { API_NOT_DEFINED } from '../../constant/msg'
import { Command } from '../../constant/vscode'
import { Client_Server_MsgTYpe } from '../../utils/types'
import { getFileCurrentWorkSpace } from './fileSys'
import store from './store'

async function checkApiTypeExist(
  typeFilePath: string,
  apiData: ApiInterface,
  key: keyof ApiInterface,
) {
  try {
    const content = (await readFile(typeFilePath))?.toString()
    const alreadyExist = content.includes(apiData[key])
    return alreadyExist
  }
  catch (error) {
    return false
  }
}

export async function quickfix(
  dove: Dove,
  params: CodeActionParams,
): Promise<CodeAction[]> {
  const diagnostics = params.context.diagnostics
  if (diagnostics && diagnostics.length === 0) {
    return []
  }

  const diagStore = store.get(params.textDocument.uri)

  const codeActions: CodeAction[] = []
  for (const diag of diagnostics) {
    const current = diagStore.diagnosticMap.get(diag.message)
    const importInfo = diagStore.importPositionInfo.get(diag.message)
    if (!current) {
      continue
    }
    if (
      diag.severity === DiagnosticSeverity.Information
      && diag.message.includes(API_NOT_DEFINED)
    ) {
      const [apiData]: [ApiInterface] = await dove.sendMessage(
        Client_Server_MsgTYpe.GIVE_INFO_FROM_PATH__SERVER,
        current.apiPath,
      )
      // 未检查到可用修复
      if (!apiData) {
        return []
      }

      const fixList: {
        range: Diagnostic['range']
        newText: string
      }[] = []

      const anyFixList: {
        range: Diagnostic['range']
        newText: string
      }[] = []

      const importList: string[] = []
      const typeFilePath = getFileCurrentWorkSpace(
        params.textDocument.uri,
        'types.ts',
      )
      // 有参数插入参数，requestBody优先级高
      if (current.paramTypeInsertPosition) {
        const exist
					= (await checkApiTypeExist(typeFilePath, apiData, 'reqBodyTitle'))
					  || (await checkApiTypeExist(typeFilePath, apiData, 'reqQueryTitle'))
        !exist && importList.push(apiData.reqBodyTypeContent || apiData.reqQueryTypeContent)
        fixList.push({
          range: {
            start: current.paramTypeInsertPosition,
            end: current.paramTypeInsertPosition,
          },
          newText: `: Partial<${
            apiData.reqBodyTypeContent ? apiData.reqBodyTitle : apiData.reqQueryTitle
          }> `,
        })
        anyFixList.push({
          range: {
            start: current.paramTypeInsertPosition,
            end: current.paramTypeInsertPosition,
          },
          newText: `: any `,
        })
      }

      // 方法泛型插入
      if (current.methodGenericInsertPosition) {
        const exist = await checkApiTypeExist(
          typeFilePath,
          apiData,
          'resBodyDataTitle',
        )
        !exist && importList.push(apiData.resBodyDataTypeContent)
        fixList.push({
          range: {
            start: current.methodGenericInsertPosition,
            end: current.methodGenericInsertPosition,
          },
          newText: apiData.resBodyDataTypeContent
            ? `<${apiData.resBodyDataTitle}>`
            : '<any>',
        })
        anyFixList.push({
          range: {
            start: current.methodGenericInsertPosition,
            end: current.methodGenericInsertPosition,
          },
          newText: `<any>`,
        })
      }

      // 有响应体插入
      if (current.fnRespTypeInsertPosition) {
        const exist = await checkApiTypeExist(
          typeFilePath,
          apiData,
          'resBodyTitle',
        )
        !exist && importList.push(apiData.resBodyTypeContent)
        fixList.push({
          range: {
            start: current.fnRespTypeInsertPosition,
            end: current.fnRespTypeInsertPosition,
          },
          newText: apiData.resBodyTypeContent
            ? `: ${YAPI_RESPONSE_NAME}<${apiData.resBodyTitle}> `
            : ': any ',
        })
        anyFixList.push({
          range: {
            start: current.fnRespTypeInsertPosition,
            end: current.fnRespTypeInsertPosition,
          },
          newText: `: any `,
        })

        // 插入YapiResponseType引用
        if (diagStore.yapiResponseNameInfo.get(diag.message)) {
          fixList.push({
            range: {
              start: diagStore.yapiResponseNameInfo.get(diag.message)!,
              end: diagStore.yapiResponseNameInfo.get(diag.message)!,
            },
            newText: getYapiResponseType(current.requestFn),
          })
        }
      }

      // 插入import
      if (importInfo) {
        if (importInfo.type === 'useOld') {
          let insertText = ''

          if (current.paramTypeInsertPosition) {
            if (apiData.reqBodyTypeContent) {
              if (!importInfo.nameList.includes(apiData.reqBodyTitle)) {
                insertText = `${insertText}, ${apiData.reqBodyTitle}`
              }
            }
            else {
              if (!importInfo.nameList.includes(apiData.reqQueryTitle)) {
                insertText = `${insertText}, ${apiData.reqQueryTitle}`
              }
            }
          }
          if (
            current.fnRespTypeInsertPosition
            && apiData.resBodyTypeContent
            && !importInfo.nameList.includes(apiData.resBodyTitle)
          ) {
            insertText += `, ${apiData.resBodyTitle} `
          }

          if (
            current.methodGenericInsertPosition
            && apiData.resBodyDataTypeContent
            && !importInfo.nameList.includes(apiData.resBodyDataTitle)
          ) {
            insertText += `, ${apiData.resBodyDataTitle} `
          }
          // 插入到已经存在的位置
          fixList.push({
            range: {
              start: importInfo.position,
              end: importInfo.position,
            },
            newText: insertText,
          })
        }
        else {
          // 插入到新位置
          fixList.push({
            range: {
              start: importInfo.position,
              end: importInfo.position,
            },
            newText: `\nimport type { ${[
              current.paramTypeInsertPosition
                ? apiData.reqBodyTypeContent
                  ? apiData.reqBodyTitle
                  : apiData.reqQueryTitle
                : '',
              current.fnRespTypeInsertPosition && apiData.resBodyTypeContent
                ? apiData.resBodyTitle
                : '',
              current.methodGenericInsertPosition && apiData.resBodyDataTypeContent
                ? apiData.resBodyDataTitle
                : '',
            ]
              .filter(Boolean)
              .join(', ')} } from './types'`,
          })
        }
      }

      codeActions.push(
        {
          title: `使用yapi接口【${apiData.title}】`,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diag],
          edit: {
            changes: {
              [params.textDocument.uri]: fixList,
            },
          },
          command: {
            command: Command.INSERT_TYPE,
            arguments: [
              {
                text: importList.join('\n\n'),
                // filePath: getFileCurrentWorkSpace(
                //   params.textDocument.uri,
                //   'types.ts'
                // ),
                filePath: typeFilePath,
              },
            ],
            title: Command.INSERT_TYPE,
          },
          isPreferred: true,
        },
        {
          title: '使用【any】定义接口',
          kind: CodeActionKind.QuickFix,
          diagnostics: [diag],
          edit: {
            changes: {
              [params.textDocument.uri]: anyFixList,
            },
          },
        },
      )
    }
  }

  return codeActions
}

function getYapiResponseType(funcName: string) {
  return `\ntype YapiResponse<T extends { data: unknown }> = Promise<Omit<ReturnType<${
    funcName === 'any' ? 'any' : `typeof ${funcName}`
  }> extends Promise<infer U> ? U : T, 'data'> & { data:  T['data']}>;\n`
}
