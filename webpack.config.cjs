const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const apiUrl = new URL(process.env.API_URL || 'http://localhost:7070/');
if (!['http:', 'https:'].includes(apiUrl.protocol) || apiUrl.username || apiUrl.password) {
  throw new Error('API_URL должен быть HTTP(S)-адресом без логина и пароля');
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.[contenthash].js',
    publicPath: '',
    clean: true
  },
  module: {
    rules: [
      { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
      { test: /\.(png|jpe?g|gif|svg|webp)$/i, type: 'asset/resource' }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html', favicon: './src/images/favicon.svg' }),
    new MiniCssExtractPlugin({ filename: 'app.[contenthash].css' }),
    new webpack.DefinePlugin({ __API_URL__: JSON.stringify(apiUrl.href) })
  ],
  devServer: {
    host: '127.0.0.1',
    port: 8080,
    open: false,
    client: { overlay: true }
  }
};
