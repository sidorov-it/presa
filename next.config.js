/* eslint-disable @typescript-eslint/no-var-requires */

const isProd = process.env.NODE_ENV === 'production';

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
    // Отключаем source maps для экономии памяти при сборке
    productionBrowserSourceMaps: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    reactStrictMode: true,
    experimental: {
        ...(isProd && {
            // Оптимизируем импорты больших библиотек только в production
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
        }),
    },
    webpack(config, { dev, _isServer }) {
        // Ограничиваем использование памяти
        config.infrastructureLogging = { level: 'error' };

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
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
