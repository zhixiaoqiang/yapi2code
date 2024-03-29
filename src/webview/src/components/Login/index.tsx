import React, { useEffect, useState } from 'react'
import { Input, Button, Typography, Switch, message } from 'antd'
import { GithubOutlined } from '@ant-design/icons'

import { dove } from '../../util'

import { MsgType } from '../../../../constant/msg'
import { Command } from '../../../../constant/vscode'
import {
	YAPI_DEFAULT_SERVER_URL,
	LOGIN_BY_LDAP
} from '../../../../constant/yapi'

import './index.less'

interface LoginProps {
	setIsLogin: React.Dispatch<React.SetStateAction<boolean | -1>>
}

const { Title } = Typography

function Login(props: LoginProps) {
	const { setIsLogin } = props
	const [serverUrl, setServerUrl] = useState(YAPI_DEFAULT_SERVER_URL)
	const [loginByLdap, setLoginByLdap] = useState(LOGIN_BY_LDAP)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)

	const warning = (content: string) => {
		message.open({
			type: 'warning',
			content
		})
	}

	const onLogin = async () => {
		// 登录校检
		if (!/^https?:\/\//.test(serverUrl)) {
			warning('请输入正确的服务器地址')
			return
		}
		if (!username || !password) {
			warning('用户名和密码不能为空')
			return
		}
		setLoading(true)
		const { origin } = new URL(serverUrl)
		dove.sendMessage(MsgType.SERVER_URL, origin)
		dove.sendMessage(MsgType.LOGIN_BY_LDAP, loginByLdap)

		const [loginStatus] = await dove.sendMessage(MsgType.LOGIN_NOW, {
			username,
			password
		})
		setLoading(false)
		if (loginStatus) {
			setIsLogin(loginStatus)
		} else {
			warning('登录失败')
		}
	}

	const getInitConfig = async () => {
		const [config] = await dove.sendMessage(MsgType.INIT_CONFIG)
		const { username, password, host } = config
		setServerUrl(host?.[0] || YAPI_DEFAULT_SERVER_URL)
		setUsername(username)
		setPassword(password)
	}

	useEffect(() => {
		getInitConfig()
	}, [])

	const onLearnMore = () => {
		dove.sendMessage(MsgType.COMMAND, {
			command: Command.GITHUB,
			data: true
		})
	}

	return (
		<div className="container">
			<Title level={5} className="title">
				yapi to code 登录
			</Title>
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

			<div className="login-type-switch">
				<Switch
					checkedChildren="ldap 登录"
					unCheckedChildren="默认登录"
					checked={loginByLdap}
					onChange={(loginByLdap) => setLoginByLdap(loginByLdap)}
				/>
			</div>
			<Button
				onClick={onLogin}
				block
				className="margin8"
				type="primary"
				loading={loading}
			>
				登录
			</Button>
			<Button type="link" className="margin8 text-right" onClick={onLearnMore}>
				<GithubOutlined />
				了解更多
			</Button>
		</div>
	)
}

export default Login
