import request from '@/utils/request'

import { AllStorageType } from '@/constant/storage'
import storage from '@/utils/storage'

import { LOGIN_PATH, LOGIN_PATH_BY_LDAP } from '@/constant/yapi'
import { debugLogin } from '@/debug'

/** 登录 */
export const login = (body: {
	email: string
	password: string
}): Promise<any> => {
	const isLoginByLdap = storage.getStorage<boolean>(
		AllStorageType.LOGIN_BY_LDAP
	)
	return request.post(isLoginByLdap ? LOGIN_PATH_BY_LDAP : LOGIN_PATH, {
		data: body
	})
}

export default async function (username: string, password: string) {
	const result = await login({
		email: username,
		password: password
	}).catch((e: any) => {
		debugLogin('登录失败，无法访问', e)
		return {
			success: false,
			errmsg: '登录失败，无法访问'
		}
	})
	const { data, errcode, errmsg } = result
	if (errcode === 0) {
		return {
			success: true,
			data: {
				loginInfo: {
					username,
					password
				},
				userInfo: data
			},
			msg: '登录成功'
		}
	} else {
		debugLogin('登录失败')
		return {
			success: false,
			msg: errmsg
		}
	}
}
