import { login } from './api'

export default async function (username: string, password: string) {
	const { data, errcode, errmsg } = await login({
		email: username,
		password: password
	}).catch((e: any) => {
		console.log(e)
		return {
			success: false,
			msg: '登录失败，无法访问'
		}
	})
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
		return {
			success: false,
			msg: errmsg
		}
	}
}
