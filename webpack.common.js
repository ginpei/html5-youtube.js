const path = require('path');

module.exports = {
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'out')
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
