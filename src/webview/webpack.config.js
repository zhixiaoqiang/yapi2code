const path = require('path')

const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurePlugin()

module.exports = smp.wrap({
	// 入口文件
	target: 'web',
	entry: {
		slideBar: './src/index.tsx'
	},
	output: {
		path: path.resolve(__dirname, '..', '..', 'dist'),
		filename: '[name].js'
	},
	// cache: {
	// 	type: 'filesystem'
	// },
	module: {
		rules: [
			{
				test: /\.(ts|js)x?$/,
				exclude: /node_modules/,
				use: ['thread-loader', 'swc-loader']
			},
			//配置less
			{
				test: /\.(less|css)$/,
				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'less-loader'
					}
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: ['file-loader']
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	mode: 'production'
})
