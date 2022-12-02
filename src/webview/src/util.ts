import { useEffect } from 'react'

import { MsgType } from '../../constant'
import Dove from '../utils/dove'

const vscode = window.acquireVsCodeApi()

export const dove = new Dove((data: any) => {
	vscode.postMessage(data)
}) // 挂载消息发送器，实现一个具有反馈机制的通信机制

export const useDoveReceiveMsg = (
	msgType: MsgType,
	callback: (data?: any) => any
) => {
	useEffect(() => {
		const key = dove.subscribe(msgType, callback)
		return () => {
			dove.unSubscribe(key)
		}
	}, [])
}
