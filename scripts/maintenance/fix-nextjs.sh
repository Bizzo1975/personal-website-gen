#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Next.js Compatibility Fix Script ===${NC}"
echo "This script will fix Next.js compatibility issues."

# Check package.json for Next.js version
NEXT_VERSION=$(grep -o '"next": *"[^"]*"' package.json | grep -o '[0-9.]*')

echo -e "\n${YELLOW}Step 1: Detected Next.js version ${NEXT_VERSION} in package.json${NC}"

# Clear Next.js cache
echo -e "\n${YELLOW}Step 2: Cleaning Next.js cache...${NC}"
rm -rf .next
echo -e "${GREEN}✅ Cache cleared${NC}"

# Check if rimraf is being used in scripts
if grep -q '"dev": *"rimraf .next && next dev"' package.json; then
  echo -e "\n${YELLOW}Your package.json already has rimraf configured in the dev script.${NC}"
else
  echo -e "\n${YELLOW}Step 3: Adding cache cleanup to npm scripts...${NC}"
  echo "Consider updating your package.json to include:"
  echo '  "scripts": {'
  echo '    "dev": "rimraf .next && next dev",'
  echo "  }"
fi

# Reinstall Next.js at the correct version
echo -e "\n${YELLOW}Step 4: Reinstalling Next.js version ${NEXT_VERSION}...${NC}"
npm install next@${NEXT_VERSION} --save

echo -e "\n${GREEN}=== Fix Complete ===${NC}"
echo "To start the development server with the correct version, run:"
echo "npm run dev"
echo "or"
echo "npx next@${NEXT_VERSION} dev"
echo ""
echo "If you encounter the same error again, make sure you're using the correct Next.js version." 