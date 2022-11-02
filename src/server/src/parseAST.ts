import * as ts from 'typescript'

import type { FunctionStruct, ApiFunctionStruct } from './types'
import { YAPI_RESPONSE_NAME, YAPI_RESPONSE_TYPE } from '../../constant'

type FunctionNode =
	| ts.ArrowFunction
	| ts.FunctionExpression
	| ts.FunctionDeclaration

export function getApiPositionList(ast: ts.SourceFile, config?: any) {
	const result: ApiFunctionStruct[] = []
	// 遍历所有节点 获取位置
	const transformer: ts.TransformerFactory<ts.Node> = (
		context: ts.TransformationContext
	) => {
		return function visitor(node: ts.Node | ts.CallExpression): ts.Node {
			if (isFunction(node) || isCreateApi(node)) {
				const apiNode = isFunction(node)
					? getApiNode(node as FunctionNode, config)
					: getApiNodeWhenCreateApi(node as ts.CallExpression, config)
				if (apiNode) {
					result.push({
						...apiNode,
						pos: node.pos,
						end: node.end
					})
				}
			}

			return ts.visitEachChild(node, visitor, context)
		}
	}
	ts.transform(ast, [transformer]) // 记录节点位置

	return result
}

function getApiNodeWhenCreateApi(
	node: ts.CallExpression,
	config?: any
): false | FunctionStruct {
	const result: FunctionStruct = { apiPath: '', requestFn: 'any' }
	// request() 形式
	const hasMethodGeneric = !!node?.typeArguments?.length

	if (!hasMethodGeneric) {
		result.methodGenericInsertPosition = getResponseGenericInsertPosition(node)
		const apiPath = getApiUrlFromExpressionNode(node)
		if (apiPath) {
			result.apiPath = apiPath
			result.requestFn = getFnName(node)
			return result
		}
	}
	return false
}

function getApiNode(node: FunctionNode, config?: any): false | FunctionStruct {
	const result: FunctionStruct = { apiPath: '', requestFn: 'any' }
	// 获取参数节点
	const paramNodes = getTheChildNode(node, ts.isParameter)

	// 参数的数量
	if (paramNodes.length > 1) {
		return false
	}
	// 参数是否进行类型定义
	const paramIsTyped =
		paramNodes.length === 0
			? true
			: getIsParamType(paramNodes[0] as ts.ParameterDeclaration)

	if (!paramIsTyped) {
		result.paramTypeInsertPosition = paramNodes[0].end
	}
	// 函数是否有返回类型
	const respIsTyped = getIsReturnType(node as ts.ArrowFunction)

	// 若参数和返回值均定义了类型，则不进行标记
	if (respIsTyped && paramIsTyped) {
		return false
	}
	// 存在参数和返回值未定义类型，读取函数体
	// isCallExpression ()=>request.get('xxx')
	const [callExpressionNode] = getTheChildNode<ts.CallExpression>(
		node,
		ts.isCallExpression
	)

	const hasResGeneric =
		callExpressionNode &&
		callExpressionNode.typeArguments &&
		callExpressionNode.typeArguments.length > 0
	if (hasResGeneric && paramIsTyped) {
		return false
	}

	if (config && config.responseType === YAPI_RESPONSE_TYPE.GENERIC) {
		if (!hasResGeneric) {
			result.methodGenericInsertPosition =
				getResponseGenericInsertPosition(callExpressionNode)
		}
	} else {
		if (!respIsTyped) {
			result.fnRespTypeInsertPosition = getFnRespInsertPosition(node)!
		}
	}

	if (callExpressionNode) {
		const apiPath = getApiUrlFromExpressionNode(callExpressionNode)
		if (apiPath) {
			result.apiPath = apiPath
			result.requestFn = getFnName(callExpressionNode)
			return result
		}
	}
	// ()=>{ return request.get('xxx') }
	const [bodyNode] = getTheChildNode(node, ts.isBlock)

	if (bodyNode) {
		const [returnNode] = getTheChildNode(bodyNode, ts.isReturnStatement)
		if (returnNode) {
			const [callExpressionNode] = getTheChildNode<ts.CallExpression>(
				returnNode,
				ts.isCallExpression
			)
			if (callExpressionNode) {
				const apiPath = getApiUrlFromExpressionNode(callExpressionNode)
				if (apiPath) {
					result.apiPath = apiPath
					result.requestFn = getFnName(callExpressionNode)
					return result
				}
			}
		}
	}

	return false
}

function isFunction(node: ts.Node): boolean {
	return (
		ts.isArrowFunction(node) ||
		ts.isFunctionExpression(node) ||
		ts.isFunctionDeclaration(node)
	)
}

function isCreateApi(node: ts.Node): boolean {
	return (
		(ts.isCallExpression(node) &&
			(node.expression as any)?.escapedText === 'createApi') ||
		(
			getTheChildNode<ts.PropertyAccessExpression>(
				node,
				ts.isPropertyAccessExpression
			)?.[0]?.expression as any
		)?.escapedText === 'createApi'
	)
}

/**
 * @description 获取指定子节点
 */
function getTheChildNode<T = ts.Node>(
	parentNode: ts.Node,
	jugeFn: (node: ts.Node) => any
): T[] {
	const gather: T[] = []
	parentNode?.forEachChild((node) => {
		if (jugeFn(node)) {
			gather.push(node as unknown as T)
		}
	})
	return gather
}

/**
 * @description 获取接口链接
 */
function getUrlFromStringNode(node: ts.StringLiteral) {
	return node.text
}

/**
 * @description 获取api URL
 */
function getApiUrlFromExpressionNode(
	node: ts.ExpressionStatement | ts.CallExpression
) {
	// ts.isStringLiteral
	const strNodes: any[] = []
	const identifierNode = getTheChildNode<ts.StringLiteral>(node, ts.isToken)
	if (identifierNode) {
		strNodes.push(
			...identifierNode.map((node) =>
				getUrlFromStringNode(node as ts.StringLiteral)
			)
		)
	}
	const strNode = getTheChildNode<ts.StringLiteral>(node, ts.isStringLiteral)
	if (strNode) {
		strNodes.push(
			...strNode.map((node) => getUrlFromStringNode(node as ts.StringLiteral))
		)
	}
	// 携带变量
	const [variableNode] = getTheChildNode<
		ts.Node & { templateSpans: ts.Node[] }
	>(node, ts.isTemplateExpression)
	if (variableNode) {
		const nodes = variableNode?.templateSpans?.map(
			(node) => getTheChildNode(node, ts.isTemplateTail)?.[0]
		)
		strNodes.push(
			...(nodes?.map((node: any) =>
				getUrlFromStringNode(node as ts.StringLiteral)
			) || [])
		)
	}

	const apiPathList = strNodes.filter((str) => /^\/.+\/.+\/.+/.test(str))

	if (apiPathList.length) {
		return apiPathList[0]
	} else {
		return false
	}
}

/**
 * @description 判断函数是否有返回类型
 */
function getIsReturnType(node: ts.ArrowFunction) {
	return node.type
}

/**
 * @description 判断参数是否有定义类型
 */
function getIsParamType(node: ts.ParameterDeclaration) {
	return node.type
}

/**
 * @description 获取函数的返回类型插入点
 */
function getFnRespInsertPosition(node: FunctionNode) {
	if (ts.isArrowFunction(node)) {
		return (node as ts.ArrowFunction).equalsGreaterThanToken.pos
	} else if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
		return (node as ts.FunctionExpression).body.pos
	}
}

/**
 * @description 查找import的位置
 */
export async function getImportTypePosition(ast: ts.SourceFile) {
	const importNodes = getTheChildNode<ts.ImportDeclaration>(
		ast,
		ts.isImportDeclaration
	)

	for (const node of importNodes) {
		const path = (node.moduleSpecifier as ts.StringLiteral).text
		if (path === './types') {
			return {
				type: 'useOld',
				position: node.importClause!.end - 1,
				nameList: getNameListFromImportClause(node.importClause!)
			}
		}
	}
	const { length, [length - 1]: last } = importNodes
	return {
		type: 'useNew',
		position: last?.end || 0
	}
}

/**
 * @description 查找YapiResponseName
 */
export function getYapiResponseInfo(ast: ts.SourceFile) {
	// 查找import
	const importNodes = getTheChildNode<ts.ImportDeclaration>(
		ast,
		ts.isImportDeclaration
	)
	for (const node of importNodes) {
		const path = node.importClause as ts.ImportClause
		const bindingNode = path.namedBindings
		const name = path.name
		if (bindingNode) {
			for (const node of getTheChildNode<ts.ImportSpecifier>(
				bindingNode,
				ts.isImportSpecifier
			)) {
				if (node.name.escapedText === YAPI_RESPONSE_NAME) {
					return {
						type: 'useOld',
						position: 0
					}
				}
			}
		}
		if (name?.escapedText === YAPI_RESPONSE_NAME) {
			return {
				type: 'useOld',
				position: 0
			}
		}
	}
	// 查找命名变量
	const typeAliasNode = getTheChildNode<ts.TypeAliasDeclaration>(
		ast,
		ts.isTypeAliasDeclaration
	)
	const interfaceNode = getTheChildNode<ts.InterfaceDeclaration>(
		ast,
		ts.isInterfaceDeclaration
	)
	for (const node of [...typeAliasNode, ...interfaceNode]) {
		if (node.name.escapedText === YAPI_RESPONSE_NAME) {
			return {
				type: 'useOld',
				position: 0
			}
		}
	}
	// 需要自定义一个YapiResponseName
	const { length, [length - 1]: last } = importNodes
	return {
		type: 'useNew',
		position: last?.end || 0
	}
}

/**
 * @description 获取函数名字
 */
function getFnName(node: ts.CallExpression): string {
	const [pNode] = getTheChildNode<ts.PropertyAccessExpression>(
		node,
		ts.isPropertyAccessExpression
	)
	if (pNode) {
		// 形式 request.get
		return (
			(pNode.expression as ts.Identifier).escapedText.toString() +
			'.' +
			(pNode.name as ts.Identifier).escapedText.toString()
		)
	} else {
		// 形式 request
		const [iNode] = getTheChildNode<ts.Identifier>(node, ts.isIdentifier)
		return iNode.escapedText.toString()
	}
}

function getResponseGenericInsertPosition(node: ts.CallExpression) {
	const [pNode] = getTheChildNode<ts.PropertyAccessExpression>(
		node,
		ts.isPropertyAccessExpression
	)
	// http expression.end  http.get 取下级name.end
	if (pNode) {
		return pNode.name.end
	} else {
		return node?.expression?.end
	}
}

/**
 * 获取导入节点的导入列表
 * import { a, b, c, d } from './types'
 * @returns { string[] } [a, b, c, d]
 */
function getNameListFromImportClause(node: ts.ImportClause): string[] {
	if (!node) {
		return []
	}
	const nameBindingsNode = node.namedBindings as ts.NamedImports
	if (!nameBindingsNode) {
		return []
	}
	return nameBindingsNode.elements.map((elem) => {
		return elem.name.escapedText.toString()
	})
}
