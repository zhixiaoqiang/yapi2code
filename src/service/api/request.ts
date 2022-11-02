import axios, { AxiosRequestConfig } from 'axios'
import * as vscode from 'vscode'

import { StorageType, ContextEnum } from '../../constant'
import storage from '../../utils/storage'
import { LOGIN_PATH } from './constant'
import { login } from './index'

// 正在登录期间，把新来的登录放入登录池中，待登录完成后再完成后续登录
// 是否正在登录
let isLogining = false
// 请求池
const requestPool: any[] = []
console.log('axios.create start')
const request = axios.create({
	withCredentials: true,
	timeout: 3000, // 超时时间3秒
	headers: {
		'Content-Type': 'application/json;charset=UTF-8',
		Cookie: (storage.getStorage(StorageType.COOKIE) as string) || ''
	}
})
console.log('axios.create start12')

request.interceptors.request.use((config) => {
	console.log('发起请求：', config.url)
	config.headers!.Cookie = storage.getStorage<string>(StorageType.COOKIE) || ''
	return config
})

request.interceptors.request.use((config) => {
	return config
})

request.interceptors.response.use(async (res) => {
	const cookie = res?.headers?.['set-cookie']
		?.map((item) => item.split(';')[0])
		.join('; ')
	if (cookie) {
		await storage.setStorage(StorageType.COOKIE, cookie)
	}
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
		const defaultData: Record<string, any> = {}
		// 是否是登录接口
		const isLoginPath = url?.indexOf(LOGIN_PATH) !== -1
		// 判断是否存在cookie
		const hasLoginCookie = storage.getStorage<string>(StorageType.COOKIE)
		// 判断上次登录时间
		const lastLoginStamp =
			storage.getStorage<number>(StorageType.LOGIN_STAMP) || 0
		// 获取账号密码
		const { username, password } =
			storage.getStorage(StorageType.LOGIN_INFO) || defaultData
		// 获取服务器地址
		const serverUrl = storage.getStorage<string>(StorageType.SERVER_URL)

		if (isLoginPath) {
			return request
				.request(config)
				.then(async (res) => {
					console.log('登录成功')
					isLogining = false
					await storage.setStorage(StorageType.LOGIN_STAMP, Date.now())
					for (const resolve of requestPool) {
						resolve(true)
					}
					return res
				})
				.catch(() => {
					console.log('登录失败')
					isLogining = false
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
			if (!isLogining) {
				isLogining = true
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
