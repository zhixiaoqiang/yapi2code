const path = require('path')

module.exports = {
	// 入口文件
	target: 'web',
	entry: {
		slideBar: './src/index.tsx'
	},
	output: {
		path: path.resolve(__dirname, '..', '..', 'dist'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{
				test: /\.(ts|js)x?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/env', { corejs: 3, useBuiltIns: 'usage' }],
							'@babel/preset-react',
							'@babel/typescript'
						],
						plugins: [
							'lodash',
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
	mode: 'development',
	devtool: 'source-map'
}
