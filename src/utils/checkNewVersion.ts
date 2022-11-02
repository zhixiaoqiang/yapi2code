import cheerio from 'cheerio'
import axios from 'axios'
import * as vscode from 'vscode'

import { EXTENSION_URL } from './constant'
import {
	StorageType,
	VERSION,
	CHECK_VERSION_TIME_DUR,
	Command
} from '../constant'
import storage from './storage'

export const getVersion = async () => {
	const { data } = await axios.get(EXTENSION_URL)
	const $ = cheerio.load(data as any)
	const node = $('.twelve.wide')
	const version = node.find('a').eq(0).text()
	const desc = node.find('.desc').html()
	return {
		version,
		desc
	}
}

export const checkVersion = async () => {
	const timeStamp = storage.getStorage(StorageType.LAST_CHECKVERSION_STAMP) || 0
	if (timeStamp + CHECK_VERSION_TIME_DUR < Date.now()) {
		const { version, desc } = await getVersion()
		if (version !== VERSION) {
			vscode.window
				.showInformationMessage(`yapi-mate 发现新版本！${desc}`, ...['去更新'])
				.then((answer) => {
					if (answer === '去更新') {
						vscode.commands.executeCommand(Command.DOWNLOAD_EXTENSION)
					}
				})
			storage.setStorage(StorageType.LAST_CHECKVERSION_STAMP, Date.now())
		}
	}
}
