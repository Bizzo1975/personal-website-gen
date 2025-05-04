#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Next.js 404 Fix Script ===${NC}"
echo "This script will fix 404 errors in your Next.js application."

# Check if we are in the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: No package.json found. Are you in the project root?${NC}"
  exit 1
fi

# Clear the Next.js cache completely
echo -e "\n${YELLOW}Step 1: Cleaning Next.js cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Cache cleared${NC}"

# Check if the app directory exists
if [ ! -d "src/app" ]; then
  echo -e "${RED}Error: src/app directory not found!${NC}"
  exit 1
fi

# Create not-found.tsx if it doesn't exist
echo -e "\n${YELLOW}Step 2: Checking for not-found page...${NC}"
if [ ! -f "src/app/not-found.tsx" ]; then
  echo -e "${YELLOW}Creating not-found.tsx page...${NC}"
  
  cat > src/app/not-found.tsx << 'EOF'
import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mb-8">
        Sorry, the page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
EOF
  
  echo -e "${GREEN}✅ Created not-found.tsx${NC}"
else
  echo -e "${GREEN}✅ not-found.tsx already exists${NC}"
fi

# Create a minimal layout.tsx if it doesn't exist
echo -e "\n${YELLOW}Step 3: Checking root layout...${NC}"
if [ ! -f "src/app/layout.tsx" ]; then
  echo -e "${RED}Error: No root layout found at src/app/layout.tsx${NC}"
  echo -e "${YELLOW}Creating basic layout.tsx...${NC}"
  
  mkdir -p src/app
  
  cat > src/app/layout.tsx << 'EOF'
import React from 'react';
import '@/styles/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | My Website',
    default: 'My Website',
  },
  description: 'My personal website built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
EOF
  
  echo -e "${GREEN}✅ Created basic layout.tsx${NC}"
else
  echo -e "${GREEN}✅ Root layout exists${NC}"
fi

# Update the next.config.js
echo -e "\n${YELLOW}Step 4: Updating Next.js configuration...${NC}"

cat > next.config.js << 'EOF'
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
EOF

echo -e "${GREEN}✅ Updated next.config.js${NC}"

# Create a basic page component to test
echo -e "\n${YELLOW}Step 5: Creating test page component...${NC}"

mkdir -p src/app/test

cat > src/app/test/page.tsx << 'EOF'
export default function TestPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>If you can see this page, your Next.js routing is working correctly!</p>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Created test page at /test${NC}"

# Final steps
echo -e "\n${GREEN}=== Fix Complete ===${NC}"
echo "To test the fix, restart your Next.js server and visit:"
echo "http://localhost:3000/test"
echo ""
echo "Other things to check:"
echo "1. Make sure your MongoDB connection is working"
echo "2. Check that dynamic routes are properly configured"
echo "3. Try rebuilding the application completely with 'npm run build'" 