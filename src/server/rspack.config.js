const path = require('path')

module.exports = {
	target: 'node',
	mode: 'production',
	entry: './src/index.ts',
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, '..', '..', 'dist'),
		filename: 'server.js',
		library: {
			type: 'commonjs2'
		}
	},
	externals: {
		vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vsceignore file
	},
	resolve: {
		extensions: ['.ts', '.js']
	}
}
