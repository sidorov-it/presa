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
    webpack(config, { dev, isServer }) {
        // Optimize webpack configuration
        config.cache = {
            type: 'filesystem',
            allowCollectingMemory: true,
            memoryCacheUnaffected: true,
            store: 'pack',
            buildDependencies: {
                // eslint-disable-next-line no-undef
                config: [__filename],
            },
            version: '1.0.0',
        };

        // Optimize module serialization
        config.snapshot = {
            ...config.snapshot,
            managedPaths: [/^(.+?[\\/]node_modules[\\/])/],
            immutablePaths: [],
            buildDependencies: {
                hash: true,
                timestamp: true,
            },
        };

        // Optimize string serialization
        if (!isServer && dev) {
            config.infrastructureLogging = {
                level: 'warn',
            };

            config.resolve.fallback = { fs: false };

            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                chunkIds: 'deterministic',
                realContentHash: true,
                runtimeChunk: {
                    name: 'runtime',
                },
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 100000,
                    cacheGroups: {
                        react_icons: {
                            test: /[\\/]node_modules[\\/]react-icons[\\/]/,
                            name: 'react-icons',
                            chunks: 'all',
                            priority: 20,
                        },
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

        return config;
    },
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ['@chakra-ui/react', 'react-icons'],
    },
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
