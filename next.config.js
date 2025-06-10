/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Always disable image optimization in development to prevent issues
    unoptimized: process.env.NODE_ENV === 'development',
  },
  webpack(config, { dev }) {
    // Configures webpack to handle MDX files
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
        }
      ]
    });

    // Windows and Docker compatibility settings
    if (dev) {
      // Enable polling for Windows development (fixes HMR issues in Docker/Windows)
      if (process.env.NEXT_WEBPACK_USEPOLLING) {
        config.watchOptions = {
          poll: 500,
          aggregateTimeout: 300,
          ignored: /node_modules/,
        };
      }

      // Additional Windows-specific optimizations
      if (process.platform === 'win32' || process.env.WATCHPACK_POLLING) {
        config.watchOptions = {
          ...config.watchOptions,
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ['**/node_modules', '**/.git', '**/.next'],
        };
      }
    }
    
    return config;
  },
  
  // Add this to ensure output is traced properly
  output: 'standalone',

  // Experimental features for better performance on Windows
  experimental: {
    // Enable SWC minification for better performance
    swcMinify: true,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
