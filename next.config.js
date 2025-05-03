/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
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
};

module.exports = nextConfig; 