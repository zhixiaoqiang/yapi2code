const rspackConfig = require('./rspack.config')

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
	...rspackConfig,
	devtool: 'eval-source-map'
}
