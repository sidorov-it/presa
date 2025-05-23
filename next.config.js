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
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Оптимизации для dev сервера
    swcMinify: true, // Используем SWC для минификации
    compiler: {
        // Удаляем console.log в production
        // eslint-disable-next-line no-undef
        removeConsole: process.env.NODE_ENV === 'production',
    },
    webpack(config, { dev }) {
        // Агрессивное кеширование для dev режима
        if (dev) {
            config.cache = {
                type: 'filesystem',
                allowCollectingMemory: true,
                memoryCacheUnaffected: true,
                store: 'pack',
                buildDependencies: {
                    // eslint-disable-next-line no-undef
                    config: [__filename],
                },
                version: '2.0.0', // Увеличена версия кеша
                maxAge: 1000 * 60 * 60 * 24 * 7, // Кеш на неделю
                compression: 'gzip', // Сжатие кеша
            };

            // Оптимизация снепшотов для быстрой пересборки
            config.snapshot = {
                ...config.snapshot,
                managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
                immutablePaths: [/^(.+?[\\/]node_modules[\\/])/],
                buildDependencies: {
                    hash: true,
                    timestamp: false, // Отключаем timestamp для стабильности
                },
                module: {
                    timestamp: false,
                    hash: true,
                },
                resolve: {
                    timestamp: false,
                    hash: true,
                },
            };

            // Минимизируем логирование
            config.infrastructureLogging = {
                level: 'error',
            };

            // Оптимизация resolve
            config.resolve = {
                ...config.resolve,
                fallback: {
                    fs: false,
                    path: false,
                    crypto: false,
                },
                // Ускоряем поиск модулей
                modules: ['node_modules'],
                symlinks: false, // Отключаем символические ссылки
                cache: true,
            };

            // Агрессивная оптимизация split chunks для dev
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                chunkIds: 'deterministic',
                realContentHash: false, // Отключаем для dev
                removeAvailableModules: false,
                removeEmptyChunks: false,
                runtimeChunk: {
                    name: 'runtime',
                },
                splitChunks: {
                    chunks: 'all',
                    minSize: 10000, // Уменьшаем минимальный размер
                    maxSize: 200000, // Увеличиваем максимальный размер
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
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

            // Ускоряем обработку модулей
            config.module.rules.push({
                test: /\.(js|mjs|jsx|ts|tsx)$/,
                include: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [],
                        cacheDirectory: true,
                        cacheCompression: false,
                    },
                },
            });
        }

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
            'react-icons',
            'lucide-react',
            '@tiptap/react',
            '@tiptap/starter-kit',
            'framer-motion',
        ],
        // // Включаем turbo mode для ускорения
        // turbo: {
        //     loaders: {
        //         '.svg': ['@svgr/webpack'],
        //     },
        // },
    },
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
