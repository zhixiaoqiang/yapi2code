import { readFile, existsSync, writeFile as fseWriteFile } from 'fs-extra'

/**
 * @description 读取文本文件
 */
export function loadFile(absPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		if (existsSync(absPath)) {
			// 文件存在-打开
			readFile(absPath, (err, data) => {
				if (err) {
					reject(err)
					return console.log(err)
				}
				return resolve(data.toString())
			})
		} else {
			// 文件不存在
			return resolve('')
		}
	})
}

/**
 * @description 获取文件路径
 */
export const getFileCurrentWorkSpace = (
	currentPath: string,
	filename: string
) => {
	const list = currentPath.split('/')
	list[list.length - 1] = filename
	return list.join('/')
}

/**
 * @description 写入文件
 */
export const writeFile = (fileAbsPath: string, fileText: string) => {
	return new Promise((resolve, reject) => {
		fseWriteFile(
			fileAbsPath.replace('file://', ''),
			fileText,
			{ flag: 'a' },
			(err) => {
				if (err) {
					reject(err)
				}
				resolve(true)
			}
		)
	})
}
