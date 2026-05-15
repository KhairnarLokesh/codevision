// A module to export the webpack config
const path = require('path');
const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  target: 'node', // extensions run in a node context
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs',
    clean: true
  },
  resolve: {
    mainFields: ['module', 'main'],
    extensions: ['.ts', '.js'], // support ts-files and js-files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                module: 'es2022',
              },
            },
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode',
    eslint: 'commonjs eslint'
  },
  optimization: {
    minimize: false
  },
  performance: {
    hints: false,
  },
  devtool: 'nosources-source-map',
};

module.exports = [extensionConfig];
