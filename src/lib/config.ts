// Application Configuration
// Centralized configuration for ports, environments, and settings

export const config = {
  // Port Configuration
  ports: {
    frontend: process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT) : 3006,
  },
  
  // Base URLs
  urls: {
    frontend: process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 3006}`,
    api: process.env.API_URL || `http://localhost:${process.env.FRONTEND_PORT || 3006}/api`,
  },
  
  // Database Configuration - MongoDB
  database: {
    type: 'mongodb',
    mongodb: {
      uri: process.env.MONGODB_URI,
      dbName: process.env.DB_NAME || 'personal_website',
    },
  },
  
  // Environment Settings
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
  
  // NextAuth Configuration
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL || `http://localhost:${process.env.FRONTEND_PORT || 3006}`,
    urlInternal: process.env.NEXTAUTH_URL_INTERNAL || `http://localhost:${process.env.FRONTEND_PORT || 3006}`,
  },
  
  // File Upload Configuration
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    uploadDir: process.env.UPLOAD_DIR || './public/uploads',
  },
  
  // Windows-specific configuration
  platform: {
    isWindows: process.platform === 'win32',
    pathSeparator: process.platform === 'win32' ? '\\' : '/',
    homeDir: process.env.HOME || process.env.USERPROFILE,
  },
};

// Helper functions for cross-platform compatibility
export const pathUtils = {
  // Convert path separators for current platform
  normalize: (path: string): string => {
    if (config.platform.isWindows) {
      return path.replace(/\//g, '\\');
    }
    return path.replace(/\\/g, '/');
  },
  
  // Join paths with correct separator
  join: (...paths: string[]): string => {
    const separator = config.platform.pathSeparator;
    return paths.join(separator).replace(/[\\\/]+/g, separator);
  },
  
  // Get absolute path with correct separators
  resolve: (path: string): string => {
    return pathUtils.normalize(require('path').resolve(path));
  },
};

export default config; 