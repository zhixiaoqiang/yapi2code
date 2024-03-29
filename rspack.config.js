const path = require('path')

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
	target: 'node',
	mode: 'production',
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		library: {
			type: 'commonjs2'
		}
	},
	externals: {
		vscode: 'commonjs vscode'
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.jsx'],
		modules: [path.resolve(__dirname, 'node_modules')],
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	builtins: {
		copy: {
			patterns: [
				{
					from: path.resolve('src', 'assets'),
					to: path.resolve('dist', 'assets')
				}
			]
		}
	},
	watchOptions: {
		ignored: /node_modules/,
		poll: true
	},
	devtool: false
}
