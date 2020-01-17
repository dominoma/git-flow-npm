const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  stats: 'errors-only',
  optimization: {
    minimize: true
  },
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
    extensions: ['.ts', '.js', '.d.ts', '.json'],
    alias: {
      '~~': __dirname,
      '@@': __dirname,
      '~': __dirname,
      '@': __dirname
    }
  },
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true })
  ]
}
