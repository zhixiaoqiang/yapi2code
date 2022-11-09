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
	cache: {
		type: 'filesystem'
	},
	module: {
		rules: [
			{
				test: /\.(t|j)sx?$/,
				exclude: /node_modules/,
				use: ['thread-loader', 'swc-loader']
			},
			//配置less
			{
				test: /\.(less|css)$/,
				use: [
					// MiniCssExtractPlugin.loader,
					'style-loader',
					'css-loader',
					'less-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				type: 'asset/resource'
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx']
	},
	mode: 'production'
})
