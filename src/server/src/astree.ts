import { createSourceFile, ScriptTarget, SourceFile } from 'typescript'

/**
 * @description 代码解析成抽象语法树
 */
export function getAST(code: string): SourceFile {
	return createSourceFile('temp.ts', code, ScriptTarget.Latest)
}
