import webpack = require("webpack");

const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
module.exports = {
    //webpack 打包时js的入口
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        //打包后js名称，支持路径+名称
        filename: 'bundle.js',
        //每次打包前清空文件
        clean: true,
    },
    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: /\.css$/i,
                        use: ["style-loader", "css-loader"],
                    },
                    {
                        test: /\.less$/i,
                        use: ['style-loader', 'css-loader', 'less-loader'],
                    },
                ]
            },
            {
                test: /\.(png|jpg|gif)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            //当加载的图片，小于limit时，会将图片编译成base64字符串形式
                            //当加载的图片，大于limit时，需要使用file-loader模块进行加载
                            limit: 15000,
                            name: 'img/[name].[hash:8].[ext]',
                        }
                    }
                ]
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                //打包时ES6+转换排除node_modules依赖
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-flow']
                    }
                }
            }
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HTMLWebpackPlugin({
            template: "./src/index.html"
        }),
        new webpack.DefinePlugin({
            __DEV__: true,
            __PROFILE__: true,
            __EXPERIMENTAL__: true,
            __UMD__: true,
        })
    ],
    devServer: {
        watchFiles: ['src/**/*', 'public/**/*'],
        compress: true,
        port: 9000,
        open: true,//自动打开浏览器
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
    },
    devtool: 'source-map',
    mode: 'development',
    resolve: {
        alias: {
            '@/': '/src/',
            'react': path.resolve(__dirname, './packages/react-18.2.0/packages/react'),
            'react-dom': path.resolve(__dirname, './packages/react-18.2.0/packages/react-dom'),
            'react-hooks': path.resolve(__dirname, './packages/react-18.2.0/packages/react/src/ReactHooks'),
            'shared': path.resolve(__dirname, './packages/react-18.2.0/packages/shared'),
            'scheduler': path.resolve(__dirname, './packages/react-18.2.0/packages/scheduler'),
            'react-reconciler': path.resolve(__dirname, './packages/react-18.2.0/packages/react-reconciler'),
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx']
    }
}