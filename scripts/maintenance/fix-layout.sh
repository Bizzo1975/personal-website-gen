#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting layout fix process...${NC}"

# Create necessary directories
mkdir -p public src/styles

# Fix SVG background assets
echo -e "${YELLOW}Ensuring background SVG assets are properly created...${NC}"
cat > public/grid-light.svg << EOF
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
  <path d="M50 0 L50 100 M0 50 L100 50" fill="none" stroke="#f0f0f0" stroke-width="0.5"/>
</svg>
EOF

cat > public/grid-dark.svg << EOF
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="none" stroke="#222222" stroke-width="0.5"/>
  <path d="M50 0 L50 100 M0 50 L100 50" fill="none" stroke="#222222" stroke-width="0.5"/>
</svg>
EOF
echo -e "${GREEN}✅ SVG assets created!${NC}"

# Update globals.css with proper Tailwind directives
echo -e "${YELLOW}Updating global CSS...${NC}"
cat > src/styles/globals.css << EOF
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 0, 0, 0;
  }
}

/* Additional custom styles */
.bg-tech-light {
  background-color: #f8fafc;
}

.bg-tech-dark {
  background-color: #0f172a;
}

/* Fix for responsive layout */
.container {
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}

@media (max-width: 640px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
EOF
echo -e "${GREEN}✅ Global CSS updated!${NC}"

# Update MarkdownContent component to handle MDX properly
echo -e "${YELLOW}Updating MarkdownContent component...${NC}"
cat > src/components/MarkdownContent.tsx << EOF
'use client';

import React from 'react';
import { MDXRemote } from 'next-mdx-remote';
import Link from 'next/link';

// Define the components to be used in MDX
const components = {
  // Custom Link component to use Next.js Link for internal links
  a: ({ href, children, ...props }: any) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
  // Add other custom components as needed
};

interface MarkdownContentProps {
  content: any;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) {
    return <div>No content available</div>;
  }
  
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <MDXRemote {...content} components={components} />
    </div>
  );
}
EOF
echo -e "${GREEN}✅ MarkdownContent component updated!${NC}"

# Clear Next.js cache
echo -e "${YELLOW}Clearing Next.js cache...${NC}"
rimraf .next
echo -e "${GREEN}✅ Cache cleared!${NC}"

echo -e "${GREEN}Layout fixes completed! Now run:${NC}"
echo -e "npm run dev" 