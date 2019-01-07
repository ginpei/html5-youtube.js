const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    Html5YouTube: './src/index.ts',
    test: './src/test.ts',
  },
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
  plugins: [
    // new HtmlWebpackPlugin({
    //   template: '',
    // }),
  ],
};
