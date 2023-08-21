import {
	visitEachChild,
	transform,
	isParameter,
	isCallExpression,
	isArrowFunction,
	isFunctionDeclaration,
	isFunctionExpression,
	isBlock,
	isReturnStatement,
	isToken,
	isStringLiteral,
	isTemplateExpression,
	isTemplateTail,
	isImportDeclaration,
	isImportSpecifier,
	isTypeAliasDeclaration,
	isInterfaceDeclaration,
	isPropertyAccessExpression,
	isIdentifier
} from 'typescript'
import type {
	ArrowFunction,
	FunctionExpression,
	FunctionDeclaration,
	SourceFile,
	TransformerFactory,
	Node,
	TransformationContext,
	CallExpression,
	ParameterDeclaration,
	StringLiteral,
	ExpressionStatement,
	ImportDeclaration,
	ImportClause,
	ImportSpecifier,
	TypeAliasDeclaration,
	InterfaceDeclaration,
	PropertyAccessExpression,
	Identifier,
	NamedImports
} from 'typescript'

import type { FunctionStruct, ApiFunctionStruct } from './types'
import { YAPI_RESPONSE_NAME, YAPI_RESPONSE_TYPE } from '../../constant/config'

type FunctionNode = ArrowFunction | FunctionExpression | FunctionDeclaration

export function getApiPositionList(ast: SourceFile, config?: any) {
	const result: ApiFunctionStruct[] = []
	// 遍历所有节点 获取位置
	const transformer: TransformerFactory<Node> = (
		context: TransformationContext
	) => {
		return function visitor(node: Node | CallExpression): Node {
			if (isFunction(node)) {
				const apiNode = getApiNode(node as FunctionNode, config)
				if (apiNode) {
					result.push({
						...apiNode,
						pos: node.pos,
						end: node.end
					})
				}
			}

			return visitEachChild(node, visitor, context)
		}
	}
	transform(ast, [transformer]) // 记录节点位置

	return result
}

function getApiNode(node: FunctionNode, config?: any): false | FunctionStruct {
	const result: FunctionStruct = { apiPath: '', requestFn: 'any' }
	// 获取参数节点
	const paramNodes = getTheChildNode(node, isParameter)

	// 参数大于一的时候不是个正常的接口传参，所以直接返回
	if (paramNodes.length > 1) {
		return false
	}
	// 参数是否进行类型定义
	const paramIsTyped =
		paramNodes.length === 0
			? true
			: getIsParamType(paramNodes[0] as ParameterDeclaration)

	if (!paramIsTyped) {
		result.paramTypeInsertPosition = paramNodes[0].end
	}
	// 函数是否有返回类型
	const respIsTyped = getIsReturnType(node as ArrowFunction)

	// 若参数和返回值均定义了类型，则不进行标记
	if (respIsTyped && paramIsTyped) {
		return false
	}
	// 存在参数和返回值未定义类型，读取函数体
	// isCallExpression ()=>request.get('xxx')
	const [callExpressionNode] = getTheChildNode<CallExpression>(
		node,
		isCallExpression
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
	const [bodyNode] = getTheChildNode(node, isBlock)

	if (bodyNode) {
		const [returnNode] = getTheChildNode(bodyNode, isReturnStatement)
		if (returnNode) {
			const [callExpressionNode] = getTheChildNode<CallExpression>(
				returnNode,
				isCallExpression
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

function isFunction(node: Node): boolean {
	return (
		isArrowFunction(node) ||
		isFunctionExpression(node) ||
		isFunctionDeclaration(node)
	)
}

/**
 * @description 获取指定子节点
 */
function getTheChildNode<T = Node>(
	parentNode: Node,
	jugeFn: (node: Node) => any
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
function getUrlFromStringNode(node: StringLiteral) {
	return node?.text || ''
}

/**
 * @description 获取api URL
 */
function getApiUrlFromExpressionNode(
	node: ExpressionStatement | CallExpression
) {
	// isStringLiteral
	const strNodes: any[] = []
	const identifierNode = getTheChildNode<StringLiteral>(node, isToken)
	if (identifierNode) {
		strNodes.push(
			...identifierNode.map((node) =>
				getUrlFromStringNode(node as StringLiteral)
			)
		)
	}
	const strNode = getTheChildNode<StringLiteral>(node, isStringLiteral)
	if (strNode) {
		strNodes.push(
			...strNode.map((node) => getUrlFromStringNode(node as StringLiteral))
		)
	}
	// 携带变量
	const [variableNode] = getTheChildNode<Node & { templateSpans: Node[] }>(
		node,
		isTemplateExpression
	)
	if (variableNode) {
		const nodes = variableNode?.templateSpans?.map(
			(node) => getTheChildNode(node, isTemplateTail)?.[0]
		)
		strNodes.push(
			...(nodes?.map((node: any) =>
				getUrlFromStringNode(node as StringLiteral)
			) || [])
		)
	}

	const apiPathList = strNodes?.filter((str) => /^\/.+\/.+\/.+/.test(str))

	if (apiPathList?.length) {
		return apiPathList[0]
	} else {
		return false
	}
}

/**
 * @description 判断函数是否有返回类型
 */
function getIsReturnType(node: ArrowFunction) {
	return node.type
}

/**
 * @description 判断参数是否有定义类型
 */
function getIsParamType(node: ParameterDeclaration) {
	return node.type
}

/**
 * @description 获取函数的返回类型插入点
 */
function getFnRespInsertPosition(node: FunctionNode) {
	if (isArrowFunction(node)) {
		return (node as ArrowFunction).equalsGreaterThanToken.pos
	} else if (isFunctionDeclaration(node) || isFunctionExpression(node)) {
		return (node as FunctionExpression).body.pos
	}
}

/**
 * @description 查找import的位置
 */
export async function getImportTypePosition(ast: SourceFile) {
	const importNodes = getTheChildNode<ImportDeclaration>(
		ast,
		isImportDeclaration
	)

	for (const node of importNodes) {
		const path = (node.moduleSpecifier as StringLiteral)?.text
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
export function getYapiResponseInfo(ast: SourceFile) {
	// 查找import
	const importNodes = getTheChildNode<ImportDeclaration>(
		ast,
		isImportDeclaration
	)
	for (const node of importNodes) {
		const path = node.importClause as ImportClause
		const bindingNode = path?.namedBindings
		const name = path?.name
		if (bindingNode) {
			for (const node of getTheChildNode<ImportSpecifier>(
				bindingNode,
				isImportSpecifier
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
	const typeAliasNode = getTheChildNode<TypeAliasDeclaration>(
		ast,
		isTypeAliasDeclaration
	)
	const interfaceNode = getTheChildNode<InterfaceDeclaration>(
		ast,
		isInterfaceDeclaration
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
function getFnName(node: CallExpression): string {
	const [pNode] = getTheChildNode<PropertyAccessExpression>(
		node,
		isPropertyAccessExpression
	)
	if (pNode) {
		// 形式 request.get
		return (
			(pNode.expression as Identifier).escapedText.toString() +
			'.' +
			(pNode.name as Identifier).escapedText.toString()
		)
	} else {
		// 形式 request
		const [iNode] = getTheChildNode<Identifier>(node, isIdentifier)
		return iNode.escapedText.toString()
	}
}

function getResponseGenericInsertPosition(node: CallExpression) {
	const [pNode] = getTheChildNode<PropertyAccessExpression>(
		node,
		isPropertyAccessExpression
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
function getNameListFromImportClause(node: ImportClause): string[] {
	try {
		if (!node) {
			return []
		}
		const nameBindingsNode = node.namedBindings as NamedImports
		if (!nameBindingsNode) {
			return []
		}
		return nameBindingsNode.elements.map((elem) => {
			return elem.name.escapedText.toString()
		})
	} catch (error) {
		return []
	}
}
