import React, { useEffect, useState } from 'react'
import { Input, Button } from 'antd'
// import { GithubOutlined } from '@ant-design/icons'

import { dove } from '../../util'
import { MsgType, Command, YAPI_DEFAULT_SERVER_URL } from '../../../../constant'
import './index.less'

interface LoginProps {
	setIsLogin: React.Dispatch<React.SetStateAction<boolean | -1>>
}

function Login(props: LoginProps) {
	const { setIsLogin } = props
	const [serverUrl, setServerUrl] = useState<string>(YAPI_DEFAULT_SERVER_URL)
	const [username, setUsername] = useState<string>('')
	const [password, setPassword] = useState<string>('')
	const [loading, setLoading] = useState(false)

	const onLogin = async () => {
		// 登录校检
		if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
			dove.sendMessage(MsgType.COMMAND, {
				command: Command.WARN_TOAST,
				data: '请输入正确的服务器地址'
			})
			return
		}
		if (!username || !password) {
			dove.sendMessage(MsgType.COMMAND, {
				command: Command.WARN_TOAST,
				data: '用户名和密码不能为空'
			})
			return
		}
		setLoading(true)
		const [loginStatus] = await dove.sendMessage(MsgType.LOGIN_NOW, {
			username,
			password
		})
		setLoading(false)
		if (loginStatus) {
			setIsLogin(loginStatus)
		} else {
			dove.sendMessage(MsgType.COMMAND, {
				command: Command.WARN_TOAST,
				data: '登录失败'
			})
		}
	}

	const onLearnMore = () => {
		dove.sendMessage(MsgType.COMMAND, {
			command: Command.GITHUB,
			data: true
		})
	}

	useEffect(() => {
		dove.sendMessage(MsgType.SERVER_URL, serverUrl)
	}, [serverUrl])

	return (
		<div className="container">
			<div>yapi登录</div>
			<div className="wrap"></div>
			<Input
				placeholder="服务器地址"
				value={serverUrl}
				maxLength={300}
				className="margin8"
				onChange={(e) => setServerUrl(e.target.value)}
			></Input>
			<Input
				placeholder="用户名"
				value={username}
				maxLength={100}
				className="margin8"
				onChange={(e) => setUsername(e.target.value)}
			></Input>
			<Input
				placeholder="密码"
				value={password}
				type="password"
				maxLength={100}
				className="margin8"
				onChange={(e) => setPassword(e.target.value)}
			></Input>
			<Button
				onClick={onLogin}
				block={true}
				className="margin8"
				type="primary"
				loading={loading}
			>
				登录
			</Button>
			<Button type="link" className="margin8 text-right" onClick={onLearnMore}>
				{/* <GithubOutlined /> */}
				了解更多
			</Button>
		</div>
	)
}

export default Login
