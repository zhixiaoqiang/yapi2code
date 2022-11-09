import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiFilled, SearchOutlined, SelectOutlined } from '@ant-design/icons'
import { Badge, Input, List, message, Spin, Tree } from 'antd'
import debounce from 'lodash/debounce'
import { DataNode } from 'antd/lib/tree/index'
import fileIcon from '../../../../assets/api-file.svg'
import { Command, YAPI_DEFAULT_SERVER_URL, MsgType } from '../../../../constant'
import { dove, useDoveReceiveMsg } from '../../util'
import './index.less'
import type {
	ApiTypeList,
	DirAndItemData,
	DirData,
	GroupData,
	ItemData,
	ProjectData
} from './types'

const { DirectoryTree } = Tree

type TreeData = DataNode & { isDubbo?: boolean; path?: string; isApi?: boolean }

function DataTree() {
	const [loading, setLoading] = useState(true)
	const [treeData, setTreeData] = useState<TreeData[]>([])
	const [filterText, setFilterText] = useState('')
	const [expandKeys, setExpendKeys] = useState<TreeData['key'][]>([])
	const [autoExpandParent, setAutoExpandParent] = useState(true)

	const onSelect = async (
		keys: (string | number)[],
		isApi = false,
		blank = false
	) => {
		if (!isApi) {
			return
		}

		message.loading('加载中', 0)
		const { length, [length - 1]: id } = String(keys[0]).split('-')
		try {
			await dove.sendMessage(MsgType.FETCH_DETAIL, {
				id,
				blank
			})
		} catch (error) {
			// message.destroy()
		}
		message.destroy()
	}

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
							children: projectData
						}
					})
				})
			} else {
				const projectData: TreeData[] = []
				treeData.push({
					title: group.group_name,
					key: group._id,
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
				console.log('dirAndItemData data', projectId, dirAndItemData)
				dirAndItemData?.forEach((dirItem) => {
					const key = `${parentKey}-${dirItem._id}`
					dirContainer.push({
						title: dirItem.name,
						key,
						children: dirItem.list?.map((apiItem) => {
							return {
								title: apiItem.title,
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
			dirData.cat?.forEach((item) => {
				const itemContainer: TreeData[] = []
				dirContainer.push({
					title: item.name,
					key: `${parentKey}-${item._id}`,
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

	useDoveReceiveMsg(MsgType.FRESH_DATA, () => {
		setLoading(true)
		getTreeData(true)
			.catch(() => {
				dove.sendMessage(MsgType.COMMAND, {
					commnad: Command.WARN_TOAST,
					data: '请求失败'
				})
			})
			.finally(() => {
				setLoading(false)
			})
	})

	const [fileList, setFileList] = useState<ApiTypeList>([])

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

	const titleRender = (nodeData: TreeData) => {
		return (
			<div className="node-container">
				<div className="node-container-content">
					<span>{nodeData.title}</span>
					{nodeData.isApi && !nodeData.isDubbo && (
						<span
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								onSelect([nodeData.key], nodeData.isApi, true)
							}}
						>
							<SelectOutlined></SelectOutlined>
						</span>
					)}
				</div>
				<div>{nodeData.isApi && nodeData.path}</div>
			</div>
		)
	}

	const getFilterNode = (nodes: TreeData[], container: TreeData[] = []) => {
		let isUrl = false
		const urlInfo = {
			projectId: '0',
			key: '0'
		}
		if (filterText.startsWith(YAPI_DEFAULT_SERVER_URL)) {
			const pt = /project\/(\d+)\/interface\/api\/(\d+)/.exec(filterText)
			if (pt) {
				isUrl = true
				urlInfo.projectId = pt[1]
				urlInfo.key = pt[2]
			}
		}

		// 筛选节点
		for (const node of nodes) {
			if (node.title?.toString().includes(filterText)) {
				container.push(node)
			} else {
				// 不包含节点，向下查找
				const hasSubTitle = !!node.path
				if (hasSubTitle) {
					// 有子标题
					const [k1, k2, k3, k4] = node.key.toString().split('-')
					const subTitle = node.path
					if (!subTitle || subTitle === filterText) {
						container.push(node)
					} else if (isUrl && urlInfo.projectId === k2 && urlInfo.key === k4) {
						container.push(node)
					}
				} else if (node.children && node.children.length) {
					const children: TreeData[] = []
					// 递归查找children
					const childrenNode = getFilterNode(node.children, children)
					if (childrenNode.length) {
						container.push({
							...node,
							children
						})
					}
				} else {
					continue
				}
			}
		}
		return container
	}

	const treeDataAfterFilter = useMemo(
		() => getFilterNode(treeData),
		[filterText, treeData]
	)
	const onExpand = (keys: TreeData['key'][]) => {
		setExpendKeys(keys)
		setAutoExpandParent(false)
	}

	useEffect(() => {
		const expandContainer: TreeData['key'][] = []
		if (treeDataAfterFilter.length === 1) {
			// 搜索结果只包含一个时展开全部
			const expandNodeKey = (nodes: TreeData[]) => {
				for (const node of nodes) {
					if (node.children) {
						expandContainer.push(node.key)
						expandNodeKey(node.children)
					}
				}
			}
			expandNodeKey(treeDataAfterFilter)
		}
		setExpendKeys((keys) => {
			return [...new Set([...keys, ...expandContainer])]
		})
	}, [treeDataAfterFilter])

	const [showApi, setShowApi] = useState<boolean>(true)
	const navigationToFile = (item: { uri: string }) => {
		dove.sendMessage(MsgType.OPEN_FILE, item?.uri)
	}

	return (
		<>
			<div className="banner">
				<div className="banner-inner" onClick={() => setShowApi(!showApi)}>
					{!showApi ? (
						<ApiFilled />
					) : (
						<Badge count={fileList.length} className="badge" />
					)}
				</div>
				{showApi ? (
					<Input
						size="small"
						placeholder="搜索API，例如：新增、/add"
						value={filterText}
						suffix={<SearchOutlined />}
						className="search-bar"
						onChange={(e) => {
							setFilterText(e.target.value)
							setAutoExpandParent(true)
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
				{showApi ? (
					<div className="tree-body">
						<DirectoryTree
							blockNode
							expandedKeys={expandKeys}
							treeData={treeDataAfterFilter}
							titleRender={titleRender}
							onSelect={(keys, { node }) => onSelect(keys, node.isApi)}
							onExpand={onExpand}
							autoExpandParent={autoExpandParent}
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
		</>
	)
}

export default DataTree
