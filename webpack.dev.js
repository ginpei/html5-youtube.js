const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  entry: {
    'html5-youtube': './src/web/html5-youtube.ts',
  },
  devtool: 'inline-source-map'
});
