import type { FieldDataNode } from 'rc-tree/lib/interface'

import { treeLevelTypeEnum } from '../DataTree/constants'

export enum menuKeyEnum {
	/** 显示文档 */
	show = 'show',
	/** 刷新 */
	refresh = 'refresh',
	/** 禁用 */
	disable = 'disable',
	/** 删除子项 */
	delete = 'delete',
	/** 复制 */
	copy = 'copy',
	/** 插入到光标处 */
	insertToPosition = 'insertToPosition'
}

export interface GroupData {
	add_time: number
	custom_field1: { enable: boolean }
	group_name: string
	role: string
	sub?: GroupData[]
	key?: string | number
	type: 'private' | 'public'
	up_time: number
	_id: number
}

export interface ProjectData {
	add_time: number
	basepath: string
	color: string
	desc: string
	env: {
		domain: string
		global: any[]
		header: any[]
		name: string
		_id: number
	}[]
	follow: boolean
	group_id: GroupData['_id']
	icon: string
	name: string
	project_type: 'private' | 'public'
	switch_notice: boolean
	uid: number
	up_time: number
	_id: number
}

export interface DirData {
	add_time: number
	desc: string
	index: number
	name: string
	project_id: ProjectData['_id']
	uid: number
	up_time: number
	__v: number
	_id: number
}

export interface DirAndItemData {
	add_time: number
	desc: string
	index: number
	name: string
	project_id: ProjectData['_id']
	uid: number
	up_time: number
	__v: number
	_id: number
	list: ItemData[]
	sub: DirAndItemData[]
	arr: ItemData[]
	type: 'col'
	parent: number
	undo: boolean
}

export interface ItemData {
	add_time: number
	api_opened: boolean
	catid: number
	edit_uid: number
	method: string
	path: string
	project_id: DirData['_id']
	status: string
	tag: string[]
	title: string
	uid: number
	_id: number
}

export type TreeData = FieldDataNode<{
	id: number
	key: string | number
	title?: React.ReactNode
	dataType: keyof typeof treeLevelTypeEnum
}> & {
	isDubbo?: boolean
	path?: string
	isApi?: boolean
	id: number
}
