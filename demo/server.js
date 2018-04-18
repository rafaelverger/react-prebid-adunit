import express from 'express';
import http from 'http';
import nunjucks from 'nunjucks';

import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackConfig from './webpack.config';

const app = express();
const server = http.createServer(app);

const compiler = webpack(webpackConfig);
const wpMiddleware = webpackMiddleware(compiler, {
  publicPath: webpackConfig.output.publicPath,
  noInfo: true,
  quiet: false,
  lazy: false,
  watchOptions: {
    aggregateTimeout: 300,
    poll: true,
    ignored: /node_modules/,
  },
  stats: {
    colors: true,
  },
  headers: { 'Access-Control-Allow-Origin': '*' },
});
const BUNDLEJS_PATH = `${webpackConfig.output.publicPath}${webpackConfig.output.filename}`;

app.use(wpMiddleware);

nunjucks.configure(__dirname, {
  express: app,
  autoescape: true,
  watch: true,
});

app.get('/', (req, res, next) => {
  return res.render('index.html', { BUNDLEJS_PATH });
});

const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || '3000';
server.listen(port, () => {
  console.log(
    'Express server listening on http://%s:%s',
    host,
    port
  );
});
