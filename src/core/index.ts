import type { ExtensionContext } from 'vscode'
import type Dove from '../utils/dove'

import { commands, env, window, workspace } from 'vscode'
import { debugLogin, debugVscodeApi, debugWebview } from '@/debug'

import { formatDubboTips, formatErrorTips } from '@/utils/yapi2type/utils'
import { getConfiguration } from '../common/vscodeapi'
import { MsgType } from '../constant/msg'
import { AllStorageType } from '../constant/storage'

import { Command, ContextEnum, EditorValueOpenTypeEnum } from '../constant/vscode'
import {
  getApiDetail,
  getDir,
  getDirAndItemList,
  getGroupList,
  getItemList,
  getProject,
} from '../services/api'
import login from '../services/api/login'

import storage from '../utils/storage'
import { data2Type } from '../utils/yapi2type'
import showDocument from './show-document'
import { SlideBarWebview } from './webviewTemplate'

export function getSlideBarWebview(context: ExtensionContext) {
  const wv = new SlideBarWebview(context)
  const gatherKey: symbol[] = []
  wv.onDidMount = (dove: Dove) => {
    // 注册消息监听
    gatherKey.push(
      // 监听命令类型
      dove.subscribe(MsgType.COMMAND, ({ command, data }) => {
        commands.executeCommand(command, data)
      }),
      // serverUrl变化
      dove.subscribe(MsgType.SERVER_URL, (serverUrl) => {
        try {
          const { origin } = new URL(serverUrl)
          storage.setStorage(AllStorageType.SERVER_URL, origin)
        }
        catch (e) {
          console.log('serverUrl格式错误', e)
          storage.setStorage(AllStorageType.SERVER_URL, '')
        }
      }),
      // loginByLdap 变化
      dove.subscribe(MsgType.LOGIN_BY_LDAP, (loginByLdap) => {
        storage.setStorage(AllStorageType.LOGIN_BY_LDAP, loginByLdap)
      }),

      // 监听登录类型
      dove.subscribe(MsgType.LOGIN_NOW, ({ username, password }) => {
        return login(username, password)
          .then((res) => {
            if (res.success) {
              // 储存登录信息
              storage.setStorage(AllStorageType.LOGIN_INFO, {
                username,
                password,
              })

              storage.setStorage(AllStorageType.USER_INFO, res.data?.userInfo)
              // 切换webview
              commands.executeCommand(
                'setContext',
                ContextEnum.SHOW_TREE_VIEW,
                true,
              )
              // 设置是否可以接收
              if (storage.getStorage(AllStorageType.WEBVIEW_DONE)) {
                const apiTypeList = storage.getStorage(
                  AllStorageType.API_TYPE_LIST,
                )
                dove.sendMessage(MsgType.API_FILE_HANDLER, apiTypeList)
              }
              return true
            }
            else {
              commands.executeCommand(Command.WARN_TOAST, res.msg)
              return false
            }
          })
          .catch((e) => {
            debugLogin('登录失败', e)
          })
      }),
      dove.subscribe(MsgType.INIT_CONFIG, async () => {
        const { username, password }
					= storage.getStorage(AllStorageType.LOGIN_INFO) || {}
        const { host } = await getConfiguration()
        return {
          username,
          password,
          host: [
            storage.getStorage<string>(AllStorageType.SERVER_URL),
            host,
          ].filter(Boolean),
        }
      }),
      // 监听是否webview加载完成
      dove.subscribe(MsgType.WEBVIEW_DONE, async () => {
        debugWebview('webview loaded')

        // 判断当前是否登录
        const isLogin = Boolean(storage.getStorage(AllStorageType.USER_INFO))

        dove.sendMessage(MsgType.LOGIN_STATUS, isLogin)

        /** 设置导航栏中的menu */
        commands.executeCommand(
          'setContext',
          ContextEnum.SHOW_TREE_VIEW,
          isLogin,
        )
        // 设置是否可以接收
        if (isLogin) {
          const apiTypeList = storage.getStorage(AllStorageType.API_TYPE_LIST)
          dove.sendMessage(MsgType.API_FILE_HANDLER, apiTypeList)
        }
        // 加载完毕
        storage.setStorage(AllStorageType.WEBVIEW_DONE, true)
      }),
      // 监听webview主动获取组
      dove.subscribe(
        MsgType.FETCH_GROUP,
        async (params: { needFresh: boolean }) => {
          const groupData = storage.getStorage(AllStorageType.DATA_GROUP)

          if (!groupData || params.needFresh) {
            const { data } = await getGroupList(undefined, params.needFresh)
            storage.setStorage(AllStorageType.DATA_GROUP, data)
            return data
          }
          else {
            return groupData
          }
        },
      ),
      // 获取yapi项目文件夹
      dove.subscribe(
        MsgType.FETCH_PROJECT,
        async (params: { needFresh: boolean, groupId: number }) => {
          const projectData = storage.getStorage(
            `${AllStorageType.DATA_PROJECT}_${params.groupId}`,
          )
          if (!projectData || params.needFresh) {
            const { data } = await getProject(params.groupId, params.needFresh)
            storage.setStorage(
              `${AllStorageType.DATA_PROJECT}_${params.groupId}`,
              data,
            )
            return data
          }
          else {
            return projectData
          }
        },
      ),
      // 获取yapi文件夹
      dove.subscribe(
        MsgType.FETCH_DIR,
        async (params: { needFresh: boolean, dirId: number }) => {
          const dirData = storage.getStorage(
            `${AllStorageType.DATA_DIR}_${params.dirId}`,
          )

          if (!dirData || params.needFresh) {
            const { data } = await getDir(params.dirId, params.needFresh)
            storage.setStorage(
              `${AllStorageType.DATA_DIR}_${params.dirId}`,
              data,
            )
            return data
          }
          else {
            return dirData
          }
        },
      ),
      // 获取yapi文件夹及接口列表
      dove.subscribe(
        MsgType.FETCH_DIR_AND_ITEM,
        async (params: { needFresh: boolean, projectId: number }) => {
          const storageKey
						= `${AllStorageType.DATA_DIR_AND_ITEM}_${params.projectId}` as const
          const dirAndItemData = storage.getStorage(storageKey)
          if (!dirAndItemData || params.needFresh) {
            const { data } = await getDirAndItemList(
              params.projectId,
              params.needFresh,
            )
            storage.setStorage(storageKey, data)
            return data
          }
          else {
            return dirAndItemData
          }
        },
      ),
      // 获取item数据
      dove.subscribe(
        MsgType.FETCH_ITEM,
        async (params: { needFresh: boolean, itemId: number }) => {
          const itemData = storage.getStorage(
            `${AllStorageType.DATA_ITEM}_${params.itemId}`,
          )

          if (!itemData || params.needFresh) {
            const { data } = await getItemList(params.itemId, params.needFresh)
            storage.setStorage(
              `${AllStorageType.DATA_ITEM}_${params.itemId}`,
              data || {
                count: 0,
                total: 0,
                list: [],
              },
            )
            return data
          }
          else {
            return itemData
          }
        },
      ),
      // 获取详情数据
      dove.subscribe(
        MsgType.FETCH_DETAIL,
        async (params: {
          id: string
          blank: boolean
          needFresh: boolean
          openType: EditorValueOpenTypeEnum
        }) => {
          const config = await getConfiguration()

          const { data } = await getApiDetail(
            params.id,
            params.needFresh,
          ).catch((e) => {
            commands.executeCommand(Command.WARN_TOAST, '请求失败，无法预览')
            commands.executeCommand(Command.WARN_TOAST, e?.toString())
            return {
              data: null,
            }
          })

          if (data?.method === 'DUBBO') {
            return showDocument(formatDubboTips(data))
          }
          if (data?.path) {
            try {
              const tsData = data2Type(data, config)

              const editor = window.activeTextEditor
              const bannerExist = !!(
                config.banner
                && editor?.document.getText().includes(config.banner)
              )
              const ignoreCheckBannerExistType = !params.openType || [EditorValueOpenTypeEnum.show, EditorValueOpenTypeEnum.copy].includes(params.openType)

              const content = [
                (ignoreCheckBannerExistType || !bannerExist) && config.banner,
                tsData.reqQueryTypeContent,
                tsData.reqBodyTypeContent,
                tsData.resDataTypeContent,
                tsData.requestContent,
              ]
                .filter(Boolean)
                .join('\n\n')

              if (params.openType === EditorValueOpenTypeEnum.openWindow) {
                await showDocument(content, {
                  blank: params.blank,
                  format: config.format,
                })
                return true
              }
              else if (params.openType === EditorValueOpenTypeEnum.copy) {
                await env.clipboard.writeText(content)
                return true
              }
              else if (params.openType === EditorValueOpenTypeEnum.insertToPosition) {
                if (editor) {
                  await editor.edit((editBuilder) => {
                    editBuilder.insert(
                      editor.selection.active,
                      `\r\n${content}`,
                    )
                  })
                  return true
                }
              }

              await showDocument(content, {
                blank: params.blank,
                format: config.format,
              })
              return true
            }
            catch (error) {
              debugVscodeApi('preview code', error)
              showDocument(
                [
                  formatErrorTips(data, '生成异常'),
                  data ? JSON.stringify(data, null, 2) : '',
                ].join('\n'),
              )
              commands.executeCommand(Command.WARN_TOAST, '无法预览')
            }
            return false
          }

          commands.executeCommand(Command.WARN_TOAST, '无法预览')
        },
      ),
      // 打开指定文件
      dove.subscribe(MsgType.OPEN_FILE, async (data) => {
        if (data) {
          openLocalFile(data?.replace('file://', ''))
        }
      }),
    )
  }
  wv.onUnMount = (dove: Dove) => {
    // 卸载消息监听
    debugVscodeApi('webview unmount')
    storage.setStorage(AllStorageType.WEBVIEW_DONE, false)
    gatherKey.map((key) => {
      dove.unSubscribe(key)
    })
  }
  return wv
}

export function openLocalFile(filePath: string) {
  // 获取TextDocument对象
  workspace
    .openTextDocument({ language: 'typescript', content: filePath })
    .then(
      (doc) => {
        // 在VSCode编辑窗口展示读取到的文本
        return window.showTextDocument(doc)
      },
      (err) => {
        debugVscodeApi(`Open ${filePath} error, ${err}.`)
      },
    )
}
