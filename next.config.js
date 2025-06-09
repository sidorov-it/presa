/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    // Включаем source maps для дебага
    productionBrowserSourceMaps: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    compiler: {
        // Удаляем console.log в production
        // eslint-disable-next-line no-undef
        // removeConsole: process.env.NODE_ENV === 'production',
    },
    webpack(config, { dev, _isServer }) {
        // Базовые оптимизации только для production
        if (!dev) {
            // Агрессивная оптимизация split chunks только для production
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        // Отдельный chunk для React
                        react: {
                            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                            name: 'react',
                            chunks: 'all',
                            priority: 40,
                            enforce: true,
                        },
                        // Отдельный chunk для Chakra UI
                        chakra: {
                            test: /[\\/]node_modules[\\/]@chakra-ui[\\/]/,
                            name: 'chakra-ui',
                            chunks: 'all',
                            priority: 35,
                            enforce: true,
                        },
                        // Отдельный chunk для Radix UI
                        radix: {
                            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                            name: 'radix-ui',
                            chunks: 'all',
                            priority: 30,
                            enforce: true,
                        },
                        // Отдельный chunk для TipTap
                        tiptap: {
                            test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
                            name: 'tiptap',
                            chunks: 'all',
                            priority: 25,
                            enforce: true,
                        },
                        // Отдельный chunk для иконок
                        icons: {
                            test: /[\\/]node_modules[\\/](react-icons|lucide-react)[\\/]/,
                            name: 'icons',
                            chunks: 'all',
                            priority: 20,
                            enforce: true,
                        },
                        // Остальные vendor библиотеки
                        vendors: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                            priority: 10,
                        },
                    },
                },
            };
        }

        // Базовые настройки resolve для всех режимов
        config.resolve = {
            ...config.resolve,
            fallback: {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                crypto: false,
            },
        };

        // Fix for "self is not defined" error
        // if (!isServer) {
        //     config.resolve.fallback = {
        //         ...config.resolve.fallback,
        //         self: false,
        //     };
        // } else {
        //     // Add polyfill for server environment
        //     const webpack = require('webpack');
        //     config.plugins = config.plugins || [];
        //     config.plugins.push(
        //         new webpack.DefinePlugin({
        //             self: 'undefined',
        //         })
        //     );
        // }

        const fileLoaderRule = config.module.rules.find(rule => rule.test?.test?.('.svg'));

        config.module.rules.push(
            {
                ...fileLoaderRule,
                test: /\.svg$/i,
                resourceQuery: /url/,
            },

            {
                test: /\.svg$/i,
                issuer: fileLoaderRule.issuer,
                resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] },
                use: ['@svgr/webpack'],
            }
        );

        fileLoaderRule.exclude = /\.svg$/i;

        return config;
    },
    reactStrictMode: true,
    experimental: {
        // Оптимизируем импорты больших библиотек
        optimizePackageImports: [
            '@chakra-ui/react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react',
            '@tiptap/react',
            '@tiptap/starter-kit',
            'framer-motion',
        ],
        // Отключаем turbo для стабильности
        // turbo: false,
    },
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
