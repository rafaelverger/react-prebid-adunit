// Webpack config for creating the production bundle.

const path = require('path');
const webpack = require('webpack');

const entry = path.resolve(__dirname, './client.js');
const distFolder = path.resolve(__dirname, './dist/');
const serverPort = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.WEBPACK_SERVER_HOST || '0.0.0.0';

module.exports = {
  devtool: 'source-map',
  entry,

  output: {
    filename: 'bundle.js',
    path: distFolder,
    publicPath: `http://${host}:${serverPort}/dist/`,
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
      }
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        BROWSER: JSON.stringify(true),
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
};
