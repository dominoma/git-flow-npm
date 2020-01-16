const path = require('path')

module.exports = {
  entry: './src/index.ts',
  stats: 'errors-only',
  mode: 'none',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'awesome-typescript-loader'
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.resolve('node_modules'),
      'node_modules'
    ],
    extensions: ['.ts', '.js', '.d.ts', '.json'],
    alias: {
      '~~': __dirname,
      '@@': __dirname,
      '~': __dirname,
      '@': __dirname
    }
  },
  plugins: []
}
