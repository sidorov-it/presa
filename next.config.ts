import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
    webpack(config) {
        config.cache = {
            type: 'filesystem',
            compression: 'gzip',
            allowCollectingMemory: true,
        };
        return config;
    },
    // compiler: {
    //   removeConsole: true,
    // },
};

export default nextConfig;
