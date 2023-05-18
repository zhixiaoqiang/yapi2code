import axios, { AxiosRequestConfig } from 'axios'
import * as vscode from 'vscode'

import storage from '../../utils/storage'

import { login } from './index'
import { LOGIN_PATH } from '../../constant/yapi'
import { AllStorageType } from '../../constant/storage'
import { ContextEnum } from '../../constant/vscode'

// 正在登录期间，把新来的登录放入登录池中，待登录完成后再完成后续登录
// 是否正在登录
let isLoggingIn = false
// 请求池
const requestPool: any[] = []
const request = axios.create({
	withCredentials: true,
	timeout: 30000, // 超时时间30秒
	headers: {
		'Content-Type': 'application/json;charset=UTF-8',
		Cookie: storage.getStorage(AllStorageType.COOKIE) || ''
	}
})

request.interceptors.request.use((config) => {
	console.log('发起请求：', config.url)
	const cookie = storage.getStorage<string>(AllStorageType.COOKIE) || ''
	Object.assign(config.headers, {
		Cookie: cookie
	})

	return config
})

request.interceptors.response.use(async (res) => {
	const cookie = res.headers['set-cookie']
		?.map((item) => item.split(';')[0])
		.join('; ')
	if (cookie) {
		await storage.setStorage(AllStorageType.COOKIE, cookie)
	}
	console.log('res', res)
	return res.data
})

const yapiReq = {
	get(path: string, config: AxiosRequestConfig = {}) {
		return this.request({
			method: 'GET',
			url: path,
			...config
		})
	},
	post(path: string, config: AxiosRequestConfig = {}) {
		return this.request({
			method: 'POST',
			url: path,
			...config
		})
	},
	request(config: AxiosRequestConfig): any {
		const { url } = config
		// 是否是登录接口
		const isLoginPath = url?.includes(LOGIN_PATH)
		// 判断是否存在cookie
		const hasLoginCookie = !!storage.getStorage<string>(AllStorageType.COOKIE)
		// 判断上次登录时间
		const lastLoginStamp =
			storage.getStorage<number>(AllStorageType.LOGIN_STAMP) || 0
		// 获取账号密码
		const { username, password } =
			storage.getStorage(AllStorageType.LOGIN_INFO) || {}
		// 获取服务器地址
		const serverUrl = storage.getStorage<string>(AllStorageType.SERVER_URL)

		if (isLoginPath) {
			return request
				.request(config)
				.then(async (res) => {
					console.log('登录成功', res)
					isLoggingIn = false
					await storage.setStorage(AllStorageType.LOGIN_STAMP, Date.now())
					for (const resolve of requestPool) {
						resolve(true)
					}
					return res
				})
				.catch((error) => {
					console.log('登录失败', error)
					isLoggingIn = false
					for (const resolve of requestPool) {
						resolve(false)
					}
				})
		}
		// 没有账号密码
		if (!username || !password || !serverUrl) {
			// 清空储存，切换到登录页
			storage.clearAll()
			vscode.commands.executeCommand(
				'setContext',
				ContextEnum.SHOW_TREE_VIEW,
				false
			)
			return Promise.reject()
		}
		// 有效期2个小时，重新登录
		if (!hasLoginCookie || lastLoginStamp + 2 * 3600 * 1000 < Date.now()) {
			if (!isLoggingIn) {
				isLoggingIn = true
				login({ email: username, password })
			}
			return new Promise((resolve) => {
				requestPool.push(resolve)
			}).then((status: any) => {
				if (!status) {
					return Promise.reject()
				}
				return this.request(config)
			})
		}

		return request.request(config)
	}
}

export default yapiReq
