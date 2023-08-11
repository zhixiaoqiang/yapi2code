import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
	FC
} from 'react'

import { message, Spin, Tree, Tooltip } from 'antd'
import {
	AppstoreAddOutlined,
	CopyOutlined,
	SnippetsOutlined
} from '@ant-design/icons'

import debounce from 'lodash-es/debounce'
import {
	Menu,
	Item,
	ItemParams,
	TriggerEvent,
	useContextMenu
} from 'react-contexify'

import fileIcon from '../../../../assets/api-file.svg'

import { dove, useDoveReceiveMsg } from '../../util'

import { Command } from '../../../../constant/vscode'
import { YAPI_DEFAULT_SERVER_URL } from '../../../../constant/yapi'
import { MsgType } from '../../../../constant/msg'

import { treeLevelTypeEnum } from '../DataTree/constants'

import 'react-contexify/dist/ReactContexify.css'

import './index.less'

import {
	menuKeyEnum,
	type DirAndItemData,
	type DirData,
	type GroupData,
	type ItemData,
	type ProjectData,
	type TreeData
} from './types'

const { DirectoryTree } = Tree
const MENU_ID = 'menu-id'

const ApiTree: FC<{ isChinese: boolean; filterText: string }> = (props) => {
	const { isChinese, filterText } = props
	const cacheTreeData = useRef<TreeData[] | null>(null)

	const [loading, setLoading] = useState(true)
	const [treeData, setTreeData] = useState<TreeData[]>([])
	const [rightContentIsApi, setRightContentIsApi] = useState(false)
	const currentTreeNode = useRef<TreeData | null>(null)

	// 🔥 you can use this hook from everywhere. All you need is the menu id
	const { show } = useContextMenu({
		id: MENU_ID
	})

	const handleMenuItemClick = useCallback(
		async ({
			data
		}: ItemParams<
			any,
			{
				type: menuKeyEnum
			}
		>) => {
			if (data?.type === menuKeyEnum.refresh) {
				currentTreeNode.current && refreshData(currentTreeNode.current)
			} else if (data?.type === menuKeyEnum.delete) {
				setTreeData((origin) =>
					updateTreeDataByKey(origin, currentTreeNode.current?.key || '', [])
				)
			} else if (
				(data?.type === menuKeyEnum.copy ||
					data?.type === menuKeyEnum.insertToPosition) &&
				currentTreeNode.current?.id
			) {
				getApiDetail({
					id: currentTreeNode.current.id,
					openType: data.type
				})
			}
		},
		[treeData]
	)

	const getApiDetail = useCallback(
		async (params: {
			id: string | number
			blank?: boolean
			needFresh?: boolean
			openType?:
				| menuKeyEnum.show
				| menuKeyEnum.copy
				| menuKeyEnum.insertToPosition
		}) => {
			const res = await dove.sendMessage(MsgType.FETCH_DETAIL, params)
			message.loading('加载中', 0)
			if (res?.[0]) {
				message.destroy()
				message.success('操作成功')
				return
			}
			message.destroy()
		},
		[]
	)

	const displayMenu = useCallback((e: TriggerEvent) => {
		show({
			event: e
		})
	}, [])

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
					dataType: treeLevelTypeEnum.group,
					key: group._id,
					id: group._id,
					children: [
						{
							_id: group._id,
							key: `${group._id}-self`,
							group_name: `self_${group.group_name}`
						},
						...group.sub
					].map((subGroup) => {
						const projectData: TreeData[] = []
						const key = `${group._id}-${subGroup._id}`
						getProjectData(
							projectData,
							subGroup._id,
							subGroup.key || key,
							needFresh
						)
						return {
							title: subGroup.group_name,
							dataType: treeLevelTypeEnum.subGroup,
							key: subGroup.key || key,
							id: subGroup._id,
							children: projectData
						}
					})
				})
			} else {
				const projectData: TreeData[] = []
				treeData.push({
					title: group.group_name,
					dataType: treeLevelTypeEnum.group,
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
					dataType: treeLevelTypeEnum.project,
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
						dataType: treeLevelTypeEnum.dir,
						key,
						id: dirItem._id,
						children: dirItem.list?.map((apiItem) => {
							return {
								title: apiItem.title,
								dataType: treeLevelTypeEnum.item,
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
					dataType: treeLevelTypeEnum.dir,
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
					dataType: treeLevelTypeEnum.item,
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
		const { dataType } = node

		if (dataType) {
			switch (dataType) {
				case treeLevelTypeEnum.group: {
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
											key: `${group._id}-self`,
											group_name: `self_${group.group_name}`
										},
										...group.sub
									].map(async (subGroup) => {
										const tempProjectData: TreeData[] = []
										const key = `${group._id}-${subGroup._id}`
										getProjectData(
											tempProjectData,
											subGroup._id,
											subGroup.key || key,
											true
										)
										return {
											title: subGroup.group_name,
											dataType: treeLevelTypeEnum.subGroup,

											key: subGroup.key || key,
											id: subGroup._id,
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

					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, projectData)
					)
					break
				}
				case treeLevelTypeEnum.subGroup: {
					const projectData: TreeData[] = []

					await getProjectData(projectData, node.id, node.key, true)

					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, projectData)
					)
					break
				}
				case treeLevelTypeEnum.project: {
					const dirContainer: TreeData[] = []
					await getDirAndItemData(dirContainer, node.id, node.key, true)
					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, dirContainer)
					)
					break
				}
				case treeLevelTypeEnum.dir: {
					const itemData: TreeData[] = []
					await getItemData(itemData, node.id, node.key, true)
					setTreeData((origin) =>
						updateTreeDataByKey(origin, node.key, itemData)
					)
					break
				}
				case treeLevelTypeEnum.item: {
					getApiDetail({
						id: node.id,
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

	useEffect(() => {
		setLoading(true)
		getTreeData().finally(() => {
			setLoading(false)
		})
	}, [])

	const renderFilterHighlightContent = useCallback(
		(text: string | undefined, filterText: string) => {
			const index = text?.indexOf(filterText) ?? -1
			const beforeStr = index >= 0 ? text?.substring(0, index) : ''
			const afterStr =
				index >= 0 ? text?.slice(index + filterText.length) : text

			return (
				<>
					{beforeStr}
					<span hidden={index < 0} className="site-tree-search-value">
						{filterText}
					</span>
					{afterStr}
				</>
			)
		},
		[]
	)

	const titleRender = useCallback(
		(nodeData: TreeData) => {
			return (
				<div className="node-container">
					<div className="node-container-content">
						<div className="line1">
							{renderFilterHighlightContent(
								nodeData.title?.toString(),
								filterText
							)}
						</div>
						{nodeData.isApi && !nodeData.isDubbo && (
							<div className="icon-list">
								<Tooltip title="复制">
									<span
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											getApiDetail({
												id: nodeData.id,
												openType: menuKeyEnum.copy
											})
										}}
									>
										<CopyOutlined />
									</span>
								</Tooltip>
								<Tooltip title="插入到光标处">
									<span
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											getApiDetail({
												id: nodeData.id,
												openType: menuKeyEnum.insertToPosition
											})
										}}
									>
										<SnippetsOutlined />
									</span>
								</Tooltip>

								<Tooltip title="在新窗口打开">
									<span
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											getApiDetail({
												id: nodeData.id,
												blank: true
											})
										}}
									>
										<AppstoreAddOutlined />
									</span>
								</Tooltip>
							</div>
						)}
					</div>
					{nodeData.isApi && (
						<div>{renderFilterHighlightContent(nodeData.path, filterText)}</div>
					)}
				</div>
			)
		},
		[filterText]
	)

	const getFilterNode = useCallback((nodes: TreeData[], filterText: string) => {
		let isApiUrl = false
		let projectId = 0
		let apiId = 0

		if (
			filterText.startsWith(YAPI_DEFAULT_SERVER_URL) ||
			/project\/(\d+)\/interface\/api\/(\d+)/.test(filterText)
		) {
			const pt = /project\/(\d+)\/interface\/api\/(\d+)/.exec(filterText)
			if (pt) {
				isApiUrl = true
				projectId = Number(pt[1])
				apiId = Number(pt[2])
			}
		}
		// 筛选节点
		function filterNode(nodes: TreeData[], container: TreeData[] = []) {
			if (isApiUrl) {
				for (const node of nodes) {
					if (node.isApi && apiId === node.id) {
						container.push(node)
						break
					} else if (node.children?.length) {
						if (
							node.dataType === treeLevelTypeEnum.project &&
							node.id !== projectId
						) {
							continue
						}

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

			for (const node of nodes) {
				if (
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
		const result = filterNode(nodes)
		return result
	}, [])

	const treeDataAfterFilter = useMemo(() => {
		if (!isChinese) {
			cacheTreeData.current = null
		}

		if (cacheTreeData.current) {
			return cacheTreeData.current
		}

		const result = filterText ? getFilterNode(treeData, filterText) : treeData

		if (isChinese) {
			cacheTreeData.current = result
		}
		return result
	}, [filterText, treeData, isChinese])

	return (
		<div className="api-tree-container">
			<Spin spinning={loading}>
				<DirectoryTree
					// checkable
					blockNode
					onRightClick={({ event, node }) => {
						displayMenu(event)
						setRightContentIsApi(!!node.isApi)
						currentTreeNode.current = node
					}}
					treeData={treeDataAfterFilter}
					titleRender={titleRender}
					onSelect={(_, { node }) =>
						node.isApi && getApiDetail({ id: node.id })
					}
				/>
			</Spin>

			<Menu id={MENU_ID} theme="dark">
				<Item
					onClick={handleMenuItemClick}
					hidden={!rightContentIsApi}
					data={{ type: menuKeyEnum.copy }}
				>
					复制
				</Item>
				<Item
					hidden={!rightContentIsApi}
					onClick={handleMenuItemClick}
					data={{ type: menuKeyEnum.insertToPosition }}
				>
					插入到光标处
				</Item>
				<Item
					onClick={handleMenuItemClick}
					data={{ type: menuKeyEnum.refresh }}
				>
					重新请求
				</Item>
				<Item onClick={handleMenuItemClick} data={{ type: menuKeyEnum.delete }}>
					清除子项
				</Item>
			</Menu>
		</div>
	)
}

export default ApiTree
