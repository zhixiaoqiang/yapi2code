export interface GroupData {
	add_time: number
	custom_field1: { enable: boolean }
	group_name: string
	role: string
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
		_id: string
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
	uid: string
	_id: string
}

export type ApiTypeList = {
	uri: string
	path: string
	apiFnList: {
		apiPath: string
		requestFn: string
	}[]
}[]
