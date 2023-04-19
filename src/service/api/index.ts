import request from './request'

import storage from '../../utils/storage'
import { StorageType } from '../../constant'
import { composeRequest } from '../../utils/componse'
import { LOGIN_PATH, LOGIN_PATH_BY_LDAP } from './constant'

const getUrl = (path: string) => {
	return storage.getStorage<string>(StorageType.SERVER_URL) + path
}

/** 登录 */
export const login = (body: { email: string; password: string }): any => {
	const isLoginByLdap = storage.getStorage<boolean>(StorageType.LOGIN_BY_LDAP)
	return request.post(getUrl(isLoginByLdap ? LOGIN_PATH_BY_LDAP : LOGIN_PATH), {
		data: body
	})
}

/** 获取分组列表 */
export const getGroupList = composeRequest(
	() => request.get(getUrl('/api/group/list')),
	600e3
) //合并请求10分钟

/** 获取项目列表 */
export const getProject = composeRequest(
	(groupId: number) =>
		request.get(getUrl('/api/project/list'), {
			params: {
				group_id: groupId,
				page: 1,
				limit: 1000
			}
		}),
	600e3
) //合并请求10分钟

/** 获取文件夹列表 */
export const getDir = composeRequest(
	(dirId: number) =>
		request.get(getUrl('/api/project/get'), {
			params: {
				id: dirId
			}
		}),
	600e3
) //合并请求10分钟

/** 获取 yapi 文件夹列表及接口列表 */
export const getDirAndItemList = composeRequest(
	(projectId: number) =>
		request.get(getUrl('/api/interface/list_menu'), {
			params: {
				project_id: projectId
			}
		}),
	600e3
) //合并请求10分钟

/** 获取item列表 */
export const getItemList = composeRequest(
	(itemId: number) =>
		request.get(getUrl('/api/interface/list_cat'), {
			params: {
				page: 1,
				limit: 1000,
				catid: itemId
			}
		}),
	600e3
) //合并请求10分钟

/** 获取接口详情 */
export const getApiDetail = composeRequest(
	(apiId: string) =>
		request.get(getUrl('/api/interface/get'), {
			params: {
				id: apiId
			}
		}),
	300e3
) // 合并请求5分钟

/** 查找接口 */
export const searchApi = composeRequest(
	(path: string) =>
		request.get(getUrl('/api/project/search'), {
			params: {
				q: path
			}
		}),
	600e3
) //合并请求10分钟
