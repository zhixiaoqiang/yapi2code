export enum Client_Server_MsgTYpe {
	GIVE_INFO_FROM_PATH__SERVER = 'GIVE_INFO_FROM_PATH__SERVER'
}

export interface YapiVSCodeConfig {
	responseType?: 'methodGeneric' | ''
}

export type ApiTypeList = {
	uri: string
	apiFnList: {
		apiPath: string
		requestFn: string
	}[]
	path?: string
}[]

export type ErrorMessage = { message: string; apiPath: string }[]
