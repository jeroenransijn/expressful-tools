var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var settings = require('./settings');

var entries = {};
settings.css.entryFiles.forEach(function (filePath) {
  entries['css/' + path.basename(filePath)] = [filePath];
});

function configBase (options) {

  var reactHot = options.reactHot || false;
  var entry = Object.assign(entries, options.jsEntryFiles);
  var moduleAssign = options.moduleAssign || {};
  var plugins = options.plugins || [];

  var babelLoaderWithQuery = 'babel-loader?' + JSON.stringify(require('./babel.dev'));

  return {
    devtool: 'source-map',
    entry: entry,
    output: {
      path: settings.outputPath,
      filename: '[name]',
      publicPath: '/dist/'
    },
    module: Object.assign({
      loaders: [
        {
          test: /(\.react\.js|\.jsx)$/,
          loaders: reactHot ? ['react-hot', babelLoaderWithQuery] : [babelLoaderWithQuery],
          exclude: /(node_modules|bower_components)/
        },
        {
          // Don’t do react hot reloading on js, since this allows
          // for people to opt out of react, and since react is a peer dependency
          // of react-hot users don’t need to install it if they are not using react.
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /(node_modules|bower_components)/,
          query: require('./babel.dev')
        },
        {
          test:   /\.css$/,
          loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader')
        }
      ],
    }, moduleAssign),
    resolve: {
      extensions: ['', '.react.js', '.js', '.jsx']
    },
    eslint: {
      configFile: path.join(__dirname, 'eslint.js'),
      useEslintrc: false
    },
    postcss: function (bundler) {
      return {
        defaults: [
          // Transfer @import rule by inlining content, e.g. @import 'normalize.css'
          // https://github.com/postcss/postcss-import
          require('postcss-import')({ addDependencyTo: bundler }),
          require('postcss-cssnext')({
            browsers: ['last 1 version'],
            warnForDuplicates: false
          }),
          require('postcss-browser-reporter')(),
          require('postcss-reporter')()
        ]
      };
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
      }),
      new ExtractTextPlugin('[name]')
    ].concat(plugins)
  };
}

module.exports = configBase;
