const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack");

export default config => {
    const { options, ...babelLoaderRule } = config.module.rules[0]; // Get the babel rule and options
    options.presets.push('@babel/preset-react', '@linaria'); // Push the necessary presets
    config.module.rules[0] = {
        ...babelLoaderRule,
        loader: undefined, // Disable the predefined babel-loader on the rule
        use: [
            {
                loader: 'babel-loader',
                options
            },
            {
                loader: '@linaria/webpack-loader',
                options: {
                    babelOptions: options // Pass the current babel options to linaria's babel instance
                }
            }
        ]
    };

    config.devServer = {
        https: true,
        historyApiFallback: true,
        port: 8080,
        proxy: {
            "/api": {
                target: "https://localhost:8000",
                secure: false
            }
        }
    };

    config.optimization = {
        minimize: config.mode === "production",
        minimizer: [
            new TerserPlugin()
        ]
    };

    config.plugins.push(
        new webpack.DefinePlugin({
            CLIENTID: JSON.stringify("907313861790-8u0up50k8acr0cqlt654lbi7dmo4aafc.apps.googleusercontent.com")
        })
    );
    config.plugins.push(new CompressionPlugin());

  };