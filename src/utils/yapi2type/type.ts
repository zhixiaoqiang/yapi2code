/**
 * @description yapi 接口详情数据
 */
export interface YapiDetailResData {
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
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'get' | 'post' | 'delete' | 'put'
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

/**
 * @description yapi 数据类型枚举
 */
export enum YapiDataTypeEnum {
  Array = 'array',
  Boolean = 'boolean',
  Integer = 'integer',
  Null = 'null',
  Object = 'object',
  String = 'string',
  Long = 'long',
  Number = 'number',
  Int64 = 'int64',
  Text = 'text',
}

/**
 * @description yapi 基础数据类型映射
 */
export const YapiBasicTypeMap = {
  [YapiDataTypeEnum.Boolean]: true,
  [YapiDataTypeEnum.Integer]: true,
  [YapiDataTypeEnum.Null]: true,
  [YapiDataTypeEnum.Number]: true,
  [YapiDataTypeEnum.String]: true,
  [YapiDataTypeEnum.Long]: true,
}

/**
 * @description yapi 数据类型映射的基础 typescript 类型
 */
export const YapiTypeMapBasicTsType = {
  [YapiDataTypeEnum.Boolean]: 'boolean',
  [YapiDataTypeEnum.Integer]: 'number',
  [YapiDataTypeEnum.Number]: 'number',
  [YapiDataTypeEnum.String]: 'string',
  [YapiDataTypeEnum.Long]: 'string | number',
  [YapiDataTypeEnum.Null]: 'null',
}

/**
 * @description yapi 数据类型映射的 typescript 类型
 */
export const YapiTypeMapTsType = {
  ...YapiTypeMapBasicTsType,
  [YapiDataTypeEnum.Array]: '[]',
  [YapiDataTypeEnum.Object]: 'Record<string, any>',
  [YapiDataTypeEnum.Int64]: 'number',
  [YapiDataTypeEnum.Text]: 'string',
}

/** 接口响应对象类型 */
export interface ResObjectBody {
  /** 数据类型 */
  type: `${YapiDataTypeEnum.Object}`
  /** 属性枚举 */
  properties: Record<string, AllTypeNode>
  title?: string
  description?: string
  required?: string[]
}

/** 接口请求对象类型 */
export type ReqBodyType = ResObjectBody

/** 返回数组类型 */
export interface ResArrayBody {
  type: `${YapiDataTypeEnum.Array}`
  items: ResObjectBody
  description?: string
  required?: string[]
}

/** json抽象语法树的节点 */
export type AllTypeNode
	= | {
	  type: `${
	  YapiDataTypeEnum.Number
	  | YapiDataTypeEnum.Integer
	  | YapiDataTypeEnum.String
	  | YapiDataTypeEnum.Boolean
	  | YapiDataTypeEnum.Null
	  | YapiDataTypeEnum.Long
	  | YapiDataTypeEnum.Int64
	  | YapiDataTypeEnum.Text
		}`
	  description?: string
	  required?: string
	}
	| ResObjectBody
	| ResArrayBody

/** 请求query参数 */
export type ReqQuery = {
  required: string
  _id: string
  name: string
  desc: string
}[]
