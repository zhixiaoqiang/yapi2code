import * as ts from 'typescript'

/**
 * @description 代码解析成抽象语法树
 */
export function getAST(code: string): ts.SourceFile {
	return ts.createSourceFile('temp.ts', code, ts.ScriptTarget.Latest)
}
