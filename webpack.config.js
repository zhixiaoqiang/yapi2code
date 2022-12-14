//@ts-check

'use strict'

const path = require('path')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()
const TerserPlugin = require('terser-webpack-plugin')

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const CopyWebpackPlugin = require('copy-webpack-plugin')

/** @type WebpackConfig */
const extensionConfig = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'production', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/index.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
		devtoolModuleFilenameTemplate: '../[resource-path]'
	},
	cache: {
		type: 'filesystem'
	},
	externals: {
		vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vsceignore file
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.jsx'],
		modules: [path.resolve(__dirname, 'node_modules')]
	},
	module: {
		rules: [
			{
				test: /\.(t|j)s$/,
				exclude: /node_modules/,
				use: ['thread-loader', 'swc-loader']
			}
		]
	},
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()]
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: path.resolve('src', 'assets'),
					to: path.resolve('dist', 'assets')
				}
			]
		})
	],
	infrastructureLogging: {
		level: 'log' // enables logging required for problem matchers
	}
}
module.exports = [smp.wrap(extensionConfig)]
