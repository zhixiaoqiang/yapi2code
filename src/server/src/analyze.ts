import {
	TypeFormatFlags,
	isFunctionDeclaration,
	isFunctionExpression,
	isArrowFunction,
	SyntaxKind,
	isReturnStatement,
	forEachChild,
	isVariableStatement
} from 'typescript'
import type { Node, Program, Type, Block, SourceFile } from 'typescript'

/**
 * 获取节点的类型
 * @param node 要获取类型的节点
 * @param program TypeScript 程序
 */
function getType(node: Node, program: Program): Type {
	return program.getTypeChecker().getTypeAtLocation(node)
}

/**
 * 获取节点的类型字符串表示
 * @param node 要获取类型的节点
 * @param program TypeScript 程序
 */
function getTypeString(node: Node, program: Program): string {
	const type = getType(node, program)

	if (!type) {
		return 'any'
	}
	if (type.isNumberLiteral()) {
		return 'number'
	}
	if (type.isStringLiteral()) {
		return 'string'
	}
	return program.getTypeChecker().typeToString(type, node, TypeFormatFlags.None)
}

/**
 * 获取函数的返回值类型
 * @param node 要获取返回值类型的函数节点
 * @param program TypeScript 程序
 */
function getReturnType(node: Node, program: Program): string {
	if (
		isFunctionDeclaration(node) ||
		isFunctionExpression(node) ||
		isArrowFunction(node)
	) {
		const body = node.body

		if (body) {
			if (body.kind === SyntaxKind.Block) {
				// 函数体为一个代码块
				const block = body as Block
				const statements = block.statements.filter(isReturnStatement)
				if (statements.length > 0) {
					const statement = statements[0]
					if (statement.expression) {
						// 处理 return 语句中的表达式
						return getTypeString(statement.expression, program)
					}
				}
			} else {
				// 函数体为一个表达式，例如箭头函数
				return getTypeString(body, program)
			}
		}
	}

	return getTypeString(node, program) || 'any'
}

/**
 * 分析代码文件中的函数返回值类型
 * @param fileName 要分析类型的代码文件名
 */
export function analyzeFunctionReturnType(
	sourceFile: SourceFile,
	program: Program
) {
	if (sourceFile) {
		const types: string[] = []

		forEachChild(sourceFile, (node) => {
			if (
				isFunctionDeclaration(node) ||
				isArrowFunction(node) ||
				isFunctionExpression(node)
			) {
				types.push(getReturnType(node, program))
			} else if (isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (
						decl.initializer &&
						(isArrowFunction(decl.initializer) ||
							isFunctionExpression(decl.initializer))
					) {
						types.push(getReturnType(decl.initializer, program))
					}
				})
			}
		})

		return types
	}
	return []
}
