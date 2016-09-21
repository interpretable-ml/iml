var path = require("path");

module.exports = {
  entry: {bundle: "./index.js", test_bundle: "./test.js"},
  output: {
    path: __dirname,
    filename: "[name].js"
  },

  module: {
    loaders: [
      {
        test: /\.css$/, loader: "style!css"
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
};
