const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
module.exports = {
    //webpack 打包时js的入口
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        //静态文件位置
        // publicPath: 'dist/'
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
        })
    ],
    mode: 'development',
    resolve: {
        alias: {
            '@/': '/src/',
            'react':path.resolve(__dirname, './packages/react-18.2.0/packages/react'),
            'react-dom':path.resolve(__dirname, './packages/react-18.2.0/packages/react-dom'),
        },
        extensions: ['.ts', '.js']
    }
}