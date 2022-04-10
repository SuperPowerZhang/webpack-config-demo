const ESLintPlugin = require('eslint-webpack-plugin')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const mode = 'production'
const HtmlWebpackPlugin = require('html-webpack-plugin')

const cssLoaders = (...loaders) => [
  // 根据开发模式选择loader
  mode === 'production' ? MiniCssExtractPlugin.loader : 'style-loader',
  {
    loader: 'css-loader',
    options: {
      modules: {
        // css 功能，导出变量到js，cscc、less等都是在这里加
        compileType: 'icss',
      },
    },
  },
  ...loaders
]

module.exports = {
  mode,
  entry: {
    main: './src/index.js',
    // 多入口文件
    admin: './src/admin.js'
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['.js', '.jsx', '.ts', '.tsx'] // 不加 .jsx 就不会检查 jsx 文件了
    }),
    // css 文件加hash, && 为false的话这一个会是false，需要筛选掉的
    mode === 'production' && new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      chunks: ['main']
    }),
    // 多页面，需要配置对应的多入口
    new HtmlWebpackPlugin({
      filename: 'admin.html',
      chunks: ['admin']
    })
  ].filter(Boolean),
  output: {
    // js文件加hash
    filename: '[name].[contenthash].js'
  },
  optimization: {
    // moduleId 固定，保证即使中间的文件删了，后面的文件id也不会变，参数named也可以
    moduleIds: 'deterministic',
    // runtime 单独打包
    runtimeChunk: 'single',
    // splitchunk 单独打包第三方文件
    splitChunks: {
      cacheGroups: {
        vendor: {
          priority: 10,
          minSize: 0, /* 如果不写 0，由于 React 文件尺寸太小，会直接跳过 */
          test: /[\\/]node_modules[\\/]/, // 为了匹配 /node_modules/ 或 \node_modules\
          name: 'vendors', // 文件名
          chunks: 'all',  // all 表示同步加载和异步加载，async 表示异步加载，initial 表示同步加载
          // 这三行的整体意思就是把两种加载方式的来自 node_modules 目录的文件打包为 vendors.xxx.js
          // 其中 vendors 是第三方的意思
        },
        common: {
          priority: 5, // 要保证node_modules，保证他们在vendors里面
          minSize: 0,
          minChunks: 2, // 只要被2个文件引用了就是共有文件
          chunks: 'all',
          name: 'common'
        }
      },
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src/')
    }
  },
  module: {
    rules: [
      // 支持 Stylus 文件
      {
        test: /\.styl(us)?$/i,
        use: cssLoaders({
          loader: 'stylus-loader',
          options: {
            stylusOptions: {
              import: [path.resolve(__dirname, 'src/stylus-vars.styl')]
            }
          },
        }),
      },
      // 支持less文件
      {
        test: /\.less$/i,
        use: cssLoaders({
          loader: 'less-loader',
          options: {
            additionalData: `
                @import "~@/less-vars.less";
              `,
          },
        }),
      },
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env'],
              ['@babel/preset-react', {runtime: 'classic'}],
              ['@babel/preset-typescript']
            ]
          }
        }
      },
      // 支持scss文件
      {
        test: /\.s[ac]ss$/i,
        use: cssLoaders(
          {
            loader: 'sass-loader',
            options: {
              // 在每个scss文件前加import vars变量
              additionalData: `
                @import "～@src/scss-vars.scss";
              `,
              sassOptions: {
                // 基于当前目录——根目录，这样可以不配alias，直接写src了： @import "src/scss-vars.scss";
                includePaths: [__dirname]
              },
            },
          },
        ),
      },
    ]
  }
}
