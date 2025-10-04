/* eslint-disable @typescript-eslint/no-var-requires */

// eslint-disable-next-line no-undef
const isProd = process.env.NODE_ENV === 'production';

const baseCsp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru https://mc.yandex.com https://widget.cloudpayments.ru",
    "connect-src 'self' https://mc.yandex.ru https://mc.yandex.com https://api.cloudpayments.ru",
    "img-src 'self' data: https://mc.yandex.ru https://mc.yandex.com https://widget.cloudpayments.ru",
    'frame-src https://mc.yandex.ru https://mc.yandex.com https://widget.cloudpayments.ru',
    'worker-src blob:',
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
];

const devExtras = [
    'connect-src http://localhost:3000 ws://localhost:3000', // HMR/DevTools
];

const csp = [...baseCsp, ...(isProd ? [] : devExtras)].join('; ');

const securityHeaders = [
    {
        key: 'Content-Security-Policy',
        value: csp,
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
];

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
        remotePatterns: [new URL('https://app.slydle.ru/uploads/**')],
    },
    async headers() {
        return [
            {
                source: '/view/:id/slide/:slide',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: csp,
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                ],
            },
            {
                source: '/(.*)', // Применять ко всем страницам
                headers: securityHeaders,
            },
        ];
    },
    reactStrictMode: true,
    experimental: {
        // Оптимизируем импорты больших библиотек (теперь и в dev режиме)
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
    },
    webpack(config, { dev, _isServer }) {
        // Ограничиваем использование памяти
        config.infrastructureLogging = { level: 'error' };

        // Оптимизация для dev режима
        if (dev) {
            config.watchOptions = {
                poll: 1000,
                aggregateTimeout: 300,
            };
        }

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
