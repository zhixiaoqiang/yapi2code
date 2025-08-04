const path = require('node:path')
const process = require('node:process')

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  entry: {
    slideBar: './src/index.tsx',
  },
  target: 'web',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '..', '..', 'dist'),
  },
  builtins: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env': '{}', // 防止部分包直接用 process.env
      'process': '{}', // 防止部分包直接用 process
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        type: 'css', // this is enabled by default for .css, so you don't need to specify it
      },
      {
        test: /.less$/,
        use: [{ loader: require.resolve('less-loader') }],
        type: 'css',
      },
      {
        test: /\.(png|svg|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  mode: 'production',
  // builtins: {
  // 	css: {
  // 		modules: {
  // 			exportsOnly: true
  // 		}
  // 	}
  // },
  watchOptions: {
    ignored: /node_modules/,
    poll: true,
  },
  devtool: false,
}
