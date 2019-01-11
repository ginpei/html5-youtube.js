const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  entry: {
    'web/html5-youtube.min': './src/web.ts',
  },
});
