import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { ApiFilled, SearchOutlined, SelectOutlined } from '@ant-design/icons'
import { Badge, Input, List, message, Spin, Tree } from 'antd'
import debounce from 'lodash/debounce'
import type { FieldDataNode, EventDataNode } from 'rc-tree/lib/interface'
import fileIcon from '../../../../assets/api-file.svg'

import { dove, useDoveReceiveMsg } from '../../util'

import { Command } from '../../../../constant/vscode'
import { YAPI_DEFAULT_SERVER_URL } from '../../../../constant/yapi'
import { MsgType } from '../../../../constant/msg'

import {
	Menu,
	Item,
	ItemParams,
	TriggerEvent,
	useContextMenu
} from 'react-contexify'
import 'react-contexify/dist/ReactContexify.css'

import './index.less'

import type {
	ApiTypeList,
	DirAndItemData,
	DirData,
	GroupData,
	ItemData,
	ProjectData
} from './types'
import { keyLengthMapEnum } from './constants'

const { DirectoryTree } = Tree
const MENU_ID = 'menu-id'

type TreeData = FieldDataNode<{
	id: number
	key: string | number
	title?: React.ReactNode
}> & {
	isDubbo?: boolean
	path?: string
	isApi?: boolean
	id: number
}

function DataTree() {
	const [showApiList, setShowApi] = useState<boolean>(true)
	const [loading, setLoading] = useState(true)
	const [treeData, setTreeData] = useState<TreeData[]>([])
	const [filterText, setFilterText] = useState('')
	const [expandKeys, setExpendKeys] = useState<TreeData['key'][]>([])
	const [fileList, setFileList] = useState<ApiTypeList>([])

	const currentTreeNode = useRef<EventDataNode<TreeData>>(null)

	// 🔥 you can use this hook from everywhere. All you need is the menu id
	const { show } = useContextMenu({
		id: MENU_ID
	})

	const handleItemClick = useCallback(
		({
			event,
			triggerEvent,
			data
		}: ItemParams<any, { type: 'refresh' | 'disable' | 'delete' }>) => {
			console.log(event, triggerEvent, currentTreeNode.current, treeData)
			if (data?.type === 'refresh') {
				currentTreeNode.current && refreshData(currentTreeNode.current)
			} else if (data?.type === 'delete') {
				setTreeData((origin) =>
					updateTreeDataByKey(origin, currentTreeNode.current?.key || '', [])
				)
			}
		},
		[treeData]
	)

	const displayMenu = useCallback((e: TriggerEvent) => {
		show({
			event: e
		})
	}, [])

	const onSelect = useCallback(
		async (
			id: string | number,
			isApi = false,
			{ needFresh = false, blank = false } = {}
		) => {
			if (!isApi) {
				return
			}

			message.loading('加载中', 0)
			try {
				await dove.sendMessage(MsgType.FETCH_DETAIL, {
					id,
					blank,
					needFresh
				})
			} catch (error) {
				// message.destroy()
			}
			message.destroy()
		},
		[]
	)

	const updateTreeData = useCallback(
		debounce(() => {
			setTreeData((treeData) => [...treeData])
		}, 300),
		[]
	)

	const getTreeData = useCallback(async (needFresh = false) => {
		// 获取组数据
		const treeData: TreeData[] = []

		const [groupRes] = await dove.sendMessage<[GroupData[]]>(
			MsgType.FETCH_GROUP,
			{
				needFresh
			}
		)
		for (const group of groupRes) {
			if (group.sub?.length) {
				treeData.push({
					title: group.group_name,
					key: group._id,
					id: group._id,
					children: [
						{
							_id: group._id,
							key: `self_${group._id}`,
							group_name: `self_${group.group_name}`
						},
						...group.sub
					].map((group) => {
						const projectData: TreeData[] = []
						getProjectData(
							projectData,
							group._id,
							group.key || group._id,
							needFresh
						)
						return {
							title: group.group_name,
							key: group.key || group._id,
							id: group._id,
							children: projectData
						}
					})
				})
			} else {
				const projectData: TreeData[] = []
				treeData.push({
					title: group.group_name,
					key: group._id,
					id: group._id,
					children: projectData
				})
				getProjectData(projectData, group._id, group._id, needFresh)
			}
		}
		setTreeData(treeData)
	}, [])

	const getProjectData = useCallback(
		async (
			projectDataContainer: TreeData[],
			groupId: number | string,
			parentKey: number | string,
			needFresh = false
		) => {
			// 获取项目数据
			const [projectData] = await dove.sendMessage<[{ list: ProjectData[] }]>(
				MsgType.FETCH_PROJECT,
				{
					needFresh,
					groupId
				}
			)
			projectData?.list?.forEach((item) => {
				const dirContainer: TreeData[] = []
				projectDataContainer.push({
					title: item.name,
					key: `${parentKey}-${item._id}`,
					id: item._id,
					children: dirContainer
				})

				getDirAndItemData(
					dirContainer,
					item._id,
					`${parentKey}-${item._id}`,
					needFresh
				)
			})
			updateTreeData()
		},
		[]
	)

	const getDirAndItemData = useCallback(
		async (
			dirContainer: TreeData[],
			projectId: number,
			parentKey: string | number,
			needFresh = false
		) => {
			const [dirAndItemData] = await dove.sendMessage<[DirAndItemData[]]>(
				MsgType.FETCH_DIR_AND_ITEM,
				{
					needFresh,
					projectId
				}
			)

			if (!dirAndItemData) {
				getDirData(dirContainer, projectId, parentKey, needFresh)
			} else {
				dirAndItemData?.forEach((dirItem) => {
					const key = `${parentKey}-${dirItem._id}`
					dirContainer.push({
						title: dirItem.name,
						key,
						id: dirItem._id,
						children: dirItem.list?.map((apiItem) => {
							return {
								title: apiItem.title,
								id: apiItem._id,
								key: `${key}-${apiItem._id}`,
								icon: <img src={fileIcon} className="leaf-icon" />,
								isLeaf: true,
								isDubbo: apiItem.method === 'DUBBO',
								path: apiItem.path,
								isApi: true
							}
						})
					})
				})
			}

			updateTreeData()
		},
		[]
	)

	const getDirData = useCallback(
		async (
			dirContainer: TreeData[],
			dirId: number,
			parentKey: string | number,
			needFresh = false
		) => {
			const [dirData] = await dove.sendMessage<[{ cat: DirData[] }]>(
				MsgType.FETCH_DIR,
				{
					needFresh,
					dirId
				}
			)
			dirData?.cat?.forEach((item) => {
				const itemContainer: TreeData[] = []
				dirContainer.push({
					title: item.name,
					key: `${parentKey}-${item._id}`,
					id: item._id,
					children: itemContainer
				})
				getItemData(
					itemContainer,
					item._id,
					`${parentKey}-${item._id}`,
					needFresh
				)
			})
			updateTreeData()
		},
		[]
	)

	const getItemData = useCallback(
		async (
			itemContainer: TreeData[],
			itemId: number,
			parentKey: string | number,
			needFresh = false
		) => {
			const [itemData] = await dove.sendMessage<[{ list: ItemData[] }]>(
				MsgType.FETCH_ITEM,
				{
					needFresh,
					itemId
				}
			)
			itemData?.list?.forEach((item) => {
				itemContainer.push({
					id: item._id,
					title: item.title,
					key: `${parentKey}-${item._id}`,
					icon: <img src={fileIcon} className="leaf-icon" />,
					isLeaf: true,
					isDubbo: item.method === 'DUBBO',
					path: item.path,
					isApi: true
				})
			})
			updateTreeData()
		},
		[]
	)

	const refreshData = useCallback(async (node: TreeData) => {
		const keys = String(node.key).split('-')

		if (keys.length) {
			switch (keys.length) {
				case keyLengthMapEnum.project: {
					const projectData: TreeData[] = []

					const [groupRes] = await dove.sendMessage<[GroupData[]]>(
						MsgType.FETCH_GROUP,
						{
							needFresh: true
						}
					)
					for (const group of groupRes) {
						if (group._id === node.id) {
							if (group.sub?.length) {
								const result = await Promise.all(
									[
										{
											_id: group._id,
											key: `self_${group._id}`,
											group_name: `self_${group.group_name}`
										},
										...group.sub
									].map(async (group) => {
										const tempProjectData: TreeData[] = []
										await getProjectData(
											tempProjectData,
											group._id,
											group.key || group._id,
											true
										)
										return {
											title: group.group_name,
											key: group.key || group._id,
											id: group._id,
											children: tempProjectData
										}
									})
								)
								projectData.push(...result)
							} else {
								await getProjectData(projectData, group._id, group._id, true)
							}
						}
					}

					console.log('projectData', projectData)

					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, projectData)
					)
					break
				}

				case keyLengthMapEnum.dirAndItem: {
					const dirContainer: TreeData[] = []
					await getDirAndItemData(dirContainer, node.id, node.key, true)
					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, dirContainer)
					)
					break
				}
				case keyLengthMapEnum.item: {
					const itemData: TreeData[] = []
					await getItemData(itemData, node.id, node.key, true)
					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, itemData)
					)
					break
				}
				case keyLengthMapEnum.api: {
					onSelect(node.id, node.isApi, {
						needFresh: true
					})
					break
				}
			}
		}
	}, [])
	const updateTreeDataByKey = useCallback(
		(
			list: TreeData[],
			key: React.Key,
			children: TreeData['children']
		): TreeData[] =>
			list.map((node) => {
				if (node.key === key) {
					return {
						...node,
						children
					}
				}

				if (String(key).includes(String(node.key)) && node.children) {
					return {
						...node,
						children: updateTreeDataByKey(node.children, key, children)
					}
				}
				return node
			}),
		[]
	)
	useDoveReceiveMsg(MsgType.FRESH_DATA, () => {
		setLoading(true)
		getTreeData(true)
			.catch(() => {
				dove.sendMessage(MsgType.COMMAND, {
					command: Command.WARN_TOAST,
					data: '请求失败'
				})
			})
			.finally(() => {
				setLoading(false)
			})
	})

	useDoveReceiveMsg(MsgType.API_FILE_HANDLER, (apiFileList) => {
		setFileList(
			apiFileList?.filter((file: ApiTypeList[0]) => file?.apiFnList?.length > 0)
		)
	})

	useEffect(() => {
		setLoading(true)
		getTreeData().finally(() => {
			setLoading(false)
		})
	}, [])

	const titleRender = useCallback((nodeData: TreeData) => {
		return (
			<div className="node-container">
				<div className="node-container-content">
					<span className="line1">{nodeData.title}</span>
					{nodeData.isApi && !nodeData.isDubbo && (
						<span
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								onSelect(nodeData.id, nodeData.isApi, { blank: true })
							}}
						>
							<SelectOutlined></SelectOutlined>
						</span>
					)}
				</div>
				<div>{nodeData.isApi && nodeData.path}</div>
			</div>
		)
	}, [])

	const getFilterNode = useCallback(
		(nodes: TreeData[], container: TreeData[] = []) => {
			let isApiUrl = false
			let hadFindApiNode = false
			const urlInfo = {
				projectId: 0,
				id: 0
			}
			if (filterText.startsWith(YAPI_DEFAULT_SERVER_URL)) {
				const pt = /project\/(\d+)\/interface\/api\/(\d+)/.exec(filterText)
				if (pt) {
					isApiUrl = true
					urlInfo.projectId = Number(pt[1])
					urlInfo.id = Number(pt[2])
				}
			}

			// 筛选节点
			function filterNode(nodes: TreeData[], container: TreeData[] = []) {
				for (const node of nodes) {
					if (hadFindApiNode) {
						return container
					}

					if (isApiUrl && node.isApi && urlInfo.id === node.id) {
						container.push(node)
						hadFindApiNode = true
					} else if (
						node.title?.toString().includes(filterText) ||
						node.path?.includes(filterText)
					) {
						container.push(node)
					} else if (node.children?.length) {
						// 递归查找children
						const childrenNode = filterNode(node.children)
						if (childrenNode.length) {
							container.push({
								...node,
								children: childrenNode
							})
						}
					}
				}
				return container
			}
			const result = filterNode(nodes, container)
			return result
		},
		[]
	)

	const treeDataAfterFilter = useMemo(
		() => (filterText ? getFilterNode(treeData) : treeData),
		[filterText, treeData]
	)
	const onExpand = useCallback((keys: TreeData['key'][]) => {
		setExpendKeys(keys)
	}, [])

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
						<Badge count={fileList.length} showZero />
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
			<Spin spinning={loading}>
				{showApiList ? (
					<div className="tree-body">
						<DirectoryTree
							// checkable
							blockNode
							onRightClick={({ event, node }) => {
								displayMenu(event)
								currentTreeNode.current = node
							}}
							expandedKeys={expandKeys}
							treeData={treeDataAfterFilter}
							titleRender={titleRender}
							onSelect={(_, { node }) => onSelect(node.id, node.isApi)}
							onExpand={onExpand}
						/>
					</div>
				) : (
					<div className="tree-body">
						<List
							loading={loading}
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
			</Spin>

			<Menu id={MENU_ID} theme="dark">
				<Item onClick={handleItemClick} data={{ type: 'refresh' }}>
					重新请求
				</Item>
				{/* <Item onClick={handleItemClick} data={{ type: 'disable' }}>
					禁用
				</Item> */}
				<Item onClick={handleItemClick} data={{ type: 'delete' }}>
					清除子项
				</Item>
			</Menu>
		</div>
	)
}

export default DataTree
