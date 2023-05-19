const path = require('path')

module.exports = {
	entry: {
		slideBar: './src/index.tsx'
	},
	target: 'web',
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, '..', '..', 'dist'),
		library: {
			type: 'module'
		}
	},
	css: {
		extract: false
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				type: 'css' // this is enabled by default for .css, so you don't need to specify it
			},
			{ test: /.less$/, use: [{ loader: 'less-loader' }], type: 'css' },
			{
				test: /\.(png|svg|jpe?g|gif)$/i,
				type: 'asset/resource'
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	mode: 'production',
	builtins: {
		css: {
			modules: {
				exportsOnly: true
			}
		}
	}
}
