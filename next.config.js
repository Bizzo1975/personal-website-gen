/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
  webpack(config) {
    // Configures webpack to handle MDX files
    config.module.rules.push({
      test: /\.mdx?$/,
      use: [
        {
          loader: '@mdx-js/loader',
        }
      ]
    });
    
    return config;
  },
  
  // Add this to ensure output is traced properly
  output: 'standalone',
  
  // Try experimental settings if needed
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
