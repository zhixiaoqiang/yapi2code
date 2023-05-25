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
	resolve: {
		extensions: ['.ts', '.js']
	},
	watchOptions: {
		ignored: /node_modules/,
		poll: true
	},
	devtool: false
}
