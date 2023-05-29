import * as ts from 'typescript'
import { resolve } from 'path'

/**
 * 获取节点的类型
 * @param node 要获取类型的节点
 * @param program TypeScript 程序
 */
function getTypeFor(node: ts.Node, program: ts.Program): ts.Type {
	return program.getTypeChecker().getTypeAtLocation(node)
}

/**
 * 获取节点的类型字符串表示
 * @param node 要获取类型的节点
 * @param program TypeScript 程序
 */
function getTypeStringFor(node: ts.Node, program: ts.Program): string {
	const type = getTypeFor(node, program)

	if (!type) {
		return 'any'
	}
	if (type.isNumberLiteral()) {
		return 'number'
	}
	if (type.isStringLiteral()) {
		return 'string'
	}
	return program
		.getTypeChecker()
		.typeToString(type, node, ts.TypeFormatFlags.None)
}

/**
 * 获取函数的返回值类型
 * @param node 要获取返回值类型的函数节点
 * @param program TypeScript 程序
 */
function getReturnTypeFor(node: ts.Node, program: ts.Program): string {
	if (
		ts.isFunctionDeclaration(node) ||
		ts.isFunctionExpression(node) ||
		ts.isArrowFunction(node)
	) {
		const body = node.body

		if (body) {
			if (body.kind === ts.SyntaxKind.Block) {
				// 函数体为一个代码块
				const block = body as ts.Block
				const statements = block.statements.filter(ts.isReturnStatement)
				if (statements.length > 0) {
					const statement = statements[0]
					if (statement.expression) {
						// 处理 return 语句中的表达式
						return getTypeStringFor(statement.expression, program)
					}
				}
			} else {
				// 函数体为一个表达式，例如箭头函数
				return getTypeStringFor(body, program)
			}
		}
	}

	return getTypeStringFor(node, program) || 'any'
}

/**
 * 分析代码文件中的函数返回值类型
 * @param fileName 要分析类型的代码文件名
 */
export function analyzeFunctionReturnType(fileName: string) {
	// 解析代码，获取 AST

	const program = ts.createProgram({
		rootNames: [fileName],
		options: ts.getDefaultCompilerOptions()
	})

	const sourceFile = program.getSourceFile(fileName)

	if (sourceFile) {
		const types: string[] = []

		ts.forEachChild(sourceFile, (node) => {
			if (
				ts.isFunctionDeclaration(node) ||
				ts.isArrowFunction(node) ||
				ts.isFunctionExpression(node)
			) {
				types.push(getReturnTypeFor(node, program))
			} else if (ts.isVariableStatement(node)) {
				node.declarationList.declarations.forEach((decl) => {
					if (
						decl.initializer &&
						(ts.isArrowFunction(decl.initializer) ||
							ts.isFunctionExpression(decl.initializer))
					) {
						types.push(getReturnTypeFor(decl.initializer, program))
					}
				})
			}
		})

		return types
	}
	return []
}

const returnType = analyzeFunctionReturnType(
	resolve(__dirname, './analyze-test-file.ts')
)
console.log(returnType) // 输出 [ 'string', 'string', 'number', 'Promise<number>', 'number' ]
