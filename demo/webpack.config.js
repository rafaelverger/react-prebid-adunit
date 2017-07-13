// Webpack config for creating the production bundle.

const path = require('path');
const webpack = require('webpack');

const distFolder = path.resolve(__dirname, './dist/');
const serverPort = parseInt(process.env.PORT, 10) || 3000;
const host = process.env.WEBPACK_SERVER_HOST || '0.0.0.0';

module.exports = {
  devtool: 'source-map',
  entry: [
    'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
    './client',
  ],

  output: {
    filename: 'bundle.js',
    path: distFolder,
    publicPath: `http://${host}:${serverPort}/dist/`,
  },

  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: ['babel-loader'],
        exclude: /node_modules/,
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
