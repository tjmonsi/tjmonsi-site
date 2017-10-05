const path = require('path');
const webpackModule = require('./utils/webpack-module');
const webpackPlugins = require('./utils/webpack-plugins');

module.exports = (dev) => {
  const dest = path.resolve(__dirname, '../public');

  const babelOptions = {
    presets: [
      require('babel-preset-env')
    ],
    plugins: [require('babel-plugin-syntax-dynamic-import'), [
      require('babel-plugin-transform-runtime'),
      {
        helpers: false,
        polyfill: false,
        regenerator: true
      }
    ]]
  };

  return {
    entry: {
      main: path.resolve(__dirname, '../index.js'),
      es5: path.resolve(__dirname, '../src/core/polyfills/es5.js'),
      es6: path.resolve(__dirname, '../src/core/polyfills/es6.js'),
      promise: path.resolve(__dirname, '../src/core/polyfills/promise.js'),
      shady: path.resolve(__dirname, '../src/core/polyfills/shadycss.js')
    },
    output: {
      filename: '[name].js',
      chunkFilename: '[name].[id].js',
      path: dest
    },
    resolve: {
      modules: [
        path.resolve(__dirname, '../node_modules'),
        path.resolve(__dirname, './node_modules'),
        path.resolve(__dirname, '../bower_components')
      ]
    },
    module: webpackModule(babelOptions),
    plugins: webpackPlugins(dev)
  };
};
