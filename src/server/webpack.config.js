//@ts-check

'use strict'

const path = require('path')

/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'production', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/index.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, '..', '..', 'dist'),
		filename: 'server.js',
		libraryTarget: 'commonjs2'
	},
	devtool: 'hidden-source-map',
	externals: {
		vscode: 'commonjs vscode'
	},
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.(t|j)s$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/env', { corejs: 3, useBuiltIns: 'usage' }],
							'@babel/typescript'
						],
						plugins: [
							[
								'@babel/plugin-transform-runtime',
								{
									absoluteRuntime: false,
									corejs: 3
								}
							]
						]
					}
				}
			}
		]
	}
}
module.exports = config
