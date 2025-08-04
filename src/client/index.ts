import type {
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node'
import { join } from 'node:path'

import { workspace } from 'vscode'
import {
  LanguageClient,
  TransportKind,
} from 'vscode-languageclient/node'
import { debugVscodeApi } from '@/debug'

import { MAIN_MSG } from '../constant/msg'
import { getApiDetail, getDir, searchApi } from '../services/api'
import Dove from '../utils/dove'
import { Client_Server_MsgTYpe } from '../utils/types'
import { data2Type } from '../utils/yapi2type'

let client: LanguageClient
let doveContext: Dove | null = null

function clientRun(): [LanguageClient, Dove] {
  // 服务器使用node实现
  const serverModule = join(__dirname, 'server.js')
  // The debug options for the server
  // --inspect=6011: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6011'] }

  // 服务端配置信息
  // 对于 Node 形式的插件，只需要定义入口文件即可，vscode 会帮我们管理好进程的状态
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  }

  // 选择控制的语言
  const clientOptions: LanguageClientOptions = {
    // 定义插件在什么时候生效
    documentSelector: [{ scheme: 'file', language: 'typescript' }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  }

  // 创建语言服务器并启动客户端
  client = new LanguageClient(
    'languageServerYapiToCode',
    'Language Server Yapi to code',
    serverOptions,
    clientOptions,
  )

  // 初始化通信器
  const dove = new Dove((msg: any) => {
    client.sendNotification(MAIN_MSG, msg)
  })

  doveContext = dove

  // 启动客户端，也会启动服务器
  client.start().then(async () => {
    debugVscodeApi('client ready')

    client.onNotification(MAIN_MSG, (data: any) => {
      dove.receiveMessage(data)
    })

    dove.subscribe(
      Client_Server_MsgTYpe.GIVE_INFO_FROM_PATH__SERVER,
      (apiPath: string) => {
        return searchApiUntilDone(apiPath).catch(() => {
          return null
        })
      },
    )
  })

  return [client, dove]
}

let vClient: LanguageClient | null = null

export function callWhenActivate() {
  let dove: null | Dove = null
	;[vClient, dove] = clientRun()
  return dove
}

export function callWhenDeactivate() {
  if (!vClient) {
    return
  }
  // 清空通信器
  doveContext?.clearAll()
  return vClient.stop()
}

/**
 * @description 按层级分解path
 * @example /a/b/c/d -> [/a/b/c/d, /b/c/d, /c/d, /d]
 */
function getPathPool(path: string) {
  const pool = path.slice(1).split('/')
  const result: string[] = []
  for (let i = 0; i < pool.length; i++) {
    result.push(`/${pool.slice(i).join('/')}`)
  }
  const temp = result[0]
  result[0] = result[2]
  result[2] = temp
  return result
}

async function searchApiUntilDone(path: string) {
  const rawPath = path
  const pathPool = getPathPool(path)
  for (const path of pathPool) {
    const { data } = await searchApi(path).catch(() => {
      return {
        data: null,
      }
    })
    if (data?.interface.length) {
      // 找到接口
      for (const api of data.interface) {
        const { projectId, _id, title } = api
        // 查找前缀
        const { data: dirData } = await getDir(projectId)
        if (dirData?.basepath + path === rawPath) {
          // 就是它了
          const { data: detailData } = await getApiDetail(_id)
          return {
            ...data2Type(detailData),
            title,
          }
        }
      }
    }
  }
  return undefined
}
