// Webpack config for creating the production bundle.

const path = require('path');
const webpack = require('webpack');

const autoprefixer = require('autoprefixer');
const distFolder = path.resolve(__dirname, '../lib');
const env = process.env.NODE_ENV || 'production';
// const cdnUrl = '//az.jusbr.com/folios/';

const externals = env === 'production' ? {
  react: 'React',
  'prop-types': 'PropTypes',
} : {};

module.exports = {
  entry: {
    index: './client',
  },

  output: {
    path: distFolder,
    filename: '[name].js',
  },

  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      }
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx', '.scss'],
  },

  externals,

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        BROWSER: JSON.stringify(true),
        NODE_ENV: JSON.stringify(env),
      },
    })
  ],
};
