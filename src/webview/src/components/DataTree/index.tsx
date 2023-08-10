import React, { useCallback, useState } from 'react'

import { Badge, Input, List, Tooltip } from 'antd'
import { ApiFilled, SearchOutlined } from '@ant-design/icons'

import ApiTree from '../ApiTree'

import { dove, useDoveReceiveMsg } from '../../util'

import { MsgType } from '../../../../constant/msg'

import './index.less'

import type { ApiTypeList } from './types'

function DataTree() {
	const [filterText, setFilterText] = useState('')
	const [showApiList, setShowApi] = useState<boolean>(true)
	const [fileList, setFileList] = useState<ApiTypeList>([])
	const [isChinese, setIsChinese] = useState(false)

	useDoveReceiveMsg(MsgType.API_FILE_HANDLER, (apiFileList) => {
		setFileList(
			apiFileList?.filter((file: ApiTypeList[0]) => file?.apiFnList?.length > 0)
		)
	})

	const navigationToFile = useCallback((item: { uri: string }) => {
		dove.sendMessage(MsgType.OPEN_FILE, item?.uri)
	}, [])

	return (
		<div className="data-tree-container">
			<div className="banner">
				<div className="banner-inner" onClick={() => setShowApi(!showApiList)}>
					{!showApiList ? (
						<ApiFilled />
					) : (
						<Tooltip title={'类型缺失接口数为' + fileList.length}>
							<Badge count={fileList.length} showZero />
						</Tooltip>
					)}
				</div>
				{showApiList ? (
					<Input
						size="small"
						placeholder="搜索API，例如：新增、/add"
						value={filterText}
						suffix={<SearchOutlined />}
						className="search-bar"
						onChange={(e) => {
							setFilterText(e.target.value)
						}}
						onCompositionStart={() => {
							setIsChinese(true)
						}}
						onCompositionEnd={() => {
							setIsChinese(false)
						}}
					></Input>
				) : (
					<div className="search-bar">
						<div className="text">
							目前待补全接口数：
							{fileList?.reduce(
								(prev, cur) => prev + cur?.apiFnList?.length,
								0
							)}
						</div>
					</div>
				)}
			</div>
			{showApiList ? (
				<ApiTree isChinese={isChinese} filterText={filterText}></ApiTree>
			) : (
				<div className="tree-body">
					<List
						itemLayout="horizontal"
						dataSource={fileList}
						className="tree-list"
						renderItem={(item) => (
							<List.Item>
								<div
									className="node-container"
									onClick={() => navigationToFile(item)}
								>
									<div>待完善接口TS：{item?.apiFnList?.length}</div>
									<a>{item?.path}</a>
								</div>
							</List.Item>
						)}
					/>
				</div>
			)}
		</div>
	)
}

export default DataTree
