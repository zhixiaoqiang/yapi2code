//@ts-check

'use strict'

const path = require('path')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'production', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/index.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, '..', '..', 'dist'),
		filename: 'server.js',
		libraryTarget: 'commonjs2',
		devtoolModuleFilenameTemplate: '../[resource-path]'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	cache: {
		type: 'filesystem'
	},
	module: {
		rules: [
			{
				test: /\.(t|j)s$/,
				exclude: /node_modules/,
				use: ['thread-loader', 'swc-loader']
			}
		]
	}
}
module.exports = smp.wrap(config)
