export interface DetailData {
	query_path: {
		path: string
		params: string[]
	}
	edit_uid: number
	status: string
	type: string
	req_body_is_json_schema: boolean
	res_body_is_json_schema: boolean
	api_opened: boolean
	index: number
	tag: string[]
	_id: number
	res_body: string
	req_body_other: string
	method: 'GET' | 'POST' | 'DELETE' | 'PUT'
	res_body_type: 'json'
	title: string
	path: string
	catid: number
	req_headers: (
		| string
		| {
				required: string
				_id: string
				name: string
				value: string
		  }
	)[]
	req_query: {
		required: string
		_id: string
		name: string
		desc: string
	}[]
	project_id: number
	req_params: any[]
	uid: number
	add_time: number
	up_time: number
	req_body_form: any[]
	__v: number
	desc: string
	markdown: string
	username: string
	dubbo_method: null
	dubbo_service: null
	req_body_type: 'json'
}
