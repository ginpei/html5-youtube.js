const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'html5-youtube': './src/web.ts',
    'test': './src/test.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'out/web')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
};
