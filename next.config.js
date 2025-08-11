const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs", "pg"],
  webpack: (config, { isServer }) => {
    // Exclude server-side modules from client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
      
      // Exclude specific modules from client bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pg': 'pg',
        'pg-native': 'pg-native',
        'pg-connection-string': 'pg-connection-string',
        'bcryptjs': 'bcryptjs',
        'fs': 'fs',
        'net': 'net',
        'tls': 'tls'
      });
    }
    
    return config;
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: true
      }
    ];
  }
};

module.exports = nextConfig; 
