import React, { useEffect, useCallback, useState } from 'react'
import { Spin } from 'antd'

import Login from './components/Login'
import DataTree from './components/DataTree'
import { dove, useDoveReceiveMsg } from './util'
import { MsgType } from '../../constant'
import './App.less'

export default function App() {
	const [isLogin, setIsLogin] = useState<boolean | -1>(-1)
	const messageEvent = useCallback((event) => {
		dove.receiveMessage(event.data) // 将消息转接给dove
	}, [])
	useEffect(() => {
		window.addEventListener('message', messageEvent)
		return () => {
			window.removeEventListener('message', messageEvent)
		}
	}, [])
	useEffect(() => {
		/** webview加载完成 */
		dove.sendMessage(MsgType.WEBVIEW_DONE, true)
	}, [])
	useDoveReceiveMsg(MsgType.LOGIN_STATUS, (isLogin: boolean) => {
		setIsLogin(Boolean(isLogin))
	})
	switch (isLogin) {
		case -1:
			return (
				<div className="spin-container">
					<Spin />
				</div>
			)
		case true:
			return <DataTree />
		case false:
			return <Login setIsLogin={setIsLogin} />
	}
}
