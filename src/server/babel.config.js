module.exports = {
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
