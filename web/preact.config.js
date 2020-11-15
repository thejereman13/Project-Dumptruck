import { resolve } from "path";

const TerserPlugin = require("terser-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack");

export default {
    /**
     * Function that mutates the original webpack config.
     * Supports asynchronous changes when a promise is returned (or it's an async function).
     *
     * @param {object} config - original webpack config.
     * @param {object} env - options passed to the CLI.
     * @param {WebpackConfigHelpers} helpers - object with useful helpers for working with the webpack config.
     * @param {object} options - this is mainly relevant for plugins (will always be empty in the config), default to an empty object
     **/
    webpack(config, env, helpers, options) {
        config.module.rules[4].use.splice(1, 0, {
            loader: "@teamsupercell/typings-for-css-modules-loader",
            options: {
                banner: "// This file is automatically generated from your CSS. Any edits will be overwritten.",
                disableLocalsExport: true
            }
        });

        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            enforce: "pre",
            use: [
                {
                    loader: require.resolve("ts-loader")
                }
            ],
            exclude: /node_modules/
        });

        config.module.rules.push({
            test: /\.(ts|tsx)$/,
            enforce: "pre",
            use: [
                {
                    options: {
                        eslintPath: require.resolve("eslint"),
                        failOnError: true
                    },
                    loader: require.resolve("eslint-loader")
                }
            ],
            exclude: /node_modules/
        });

        config.optimization = {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false
                })
            ]
        };

        config.devServer = {
            https: true,
            historyApiFallback: true,
            proxy: {
                "/api": {
                    target: "https://localhost:8000",
                    secure: false
                }
            }
        };

        config.plugins.push(
            new webpack.DefinePlugin({
                CLIENTID: JSON.stringify("907313861790-8u0up50k8acr0cqlt654lbi7dmo4aafc.apps.googleusercontent.com")
            })
        );
        config.plugins.push(new CompressionPlugin());

        // Use any `index` file, not just index.js
        config.resolve.alias["preact-cli-entrypoint"] = resolve(process.cwd(), "src", "index");
    }
};
