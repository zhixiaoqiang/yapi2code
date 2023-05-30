import {
	createSourceFile,
	ScriptTarget,
	SourceFile,
	createProgram,
	Program,
	getDefaultCompilerOptions
} from 'typescript'

/**
 * @description 代码解析成抽象语法树
 */
export function getAST(code: string): SourceFile {
	return createSourceFile('temp.ts', code, ScriptTarget.Latest)
}

export function getProgramAndSourceFile(fileName: string): {
	program: Program
	sourceFile: SourceFile | undefined
} {
	// 解析代码，获取 AST

	const program = createProgram({
		rootNames: [fileName],
		options: getDefaultCompilerOptions()
	})

	return {
		program,
		sourceFile: program.getSourceFile(fileName)
	}
}
