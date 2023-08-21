import axios, { AxiosRequestConfig } from 'axios'
import { commands } from 'vscode'
import storage from './storage'

import { login } from '../services/api/login'
import { LOGIN_PATH } from '../constant/yapi'
import { AllStorageType } from '../constant/storage'
import { ContextEnum } from '../constant/vscode'
import { debugLogin, debugRequest } from '@/debug'

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
	debugRequest('发起请求：', config.url)
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
	debugRequest('响应结果 res', res)
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
	request(config: AxiosRequestConfig): Promise<any> {
		const { url } = config

		// 是否是登录接口
		const isLoginPath = url?.includes(LOGIN_PATH)

		// 添加 host
		config.url = storage.getStorage<string>(AllStorageType.SERVER_URL) + url

		if (isLoginPath) {
			return request
				.request(config)
				.then(async (res) => {
					debugLogin('登录成功', res)
					isLoggingIn = false
					await storage.setStorage(AllStorageType.LOGIN_STAMP, Date.now())
					for (const resolve of requestPool) {
						resolve(true)
					}
					return res
				})
				.catch((error) => {
					debugLogin('登录失败', error)
					isLoggingIn = false
					for (const resolve of requestPool) {
						resolve(false)
					}
				})
		}

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

		// 没有账号密码
		if (!username || !password || !serverUrl) {
			// 清空储存，切换到登录页
			storage.clearAll()
			commands.executeCommand('setContext', ContextEnum.SHOW_TREE_VIEW, false)
			return Promise.reject()
		}
		// 有效期2个小时，重新登录
		if (
			isLoggingIn ||
			!hasLoginCookie ||
			lastLoginStamp + 2 * 3600 * 1000 < Date.now()
		) {
			return pushToRequestPool(config, { username, password })
		}

		return request
			.request<any, { errcode: number; data: any; [key: string]: any }>(config)
			.then((res) => {
				if (res.errcode === 40011) {
					return pushToRequestPool(config, { username, password })
				}
				return res
			})
	}
}

// 将请求推入请求池并返回一个 Promise
const pushToRequestPool = (
	config: AxiosRequestConfig,
	{ username, password }: { username: string; password: string }
) => {
	if (!isLoggingIn) {
		isLoggingIn = true
		login({ email: username, password })
	}
	return new Promise<boolean>((resolve) => {
		requestPool.push(resolve)
	}).then((status) => {
		if (!status) {
			return Promise.reject()
		}
		return yapiReq.request(config)
	})
}

export default yapiReq
