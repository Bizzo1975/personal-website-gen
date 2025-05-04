#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Next.js Project Runner ===${NC}"

# Find the correct project directory
CURRENT_DIR=$(pwd)

# Check if we're in the correct directory by looking for package.json
if [ -f "package.json" ]; then
  echo -e "${GREEN}Found project at: ${CURRENT_DIR}${NC}"
  PROJECT_DIR=$CURRENT_DIR
else
  # Check if we're in the parent directory
  if [ -f "Website/package.json" ]; then
    echo -e "${YELLOW}Found project at: ${CURRENT_DIR}/Website${NC}"
    echo -e "Changing to the correct directory..."
    cd Website
    PROJECT_DIR="${CURRENT_DIR}/Website"
  else
    echo -e "${RED}Error: Could not find a valid Next.js project (no package.json found)${NC}"
    echo -e "Please run this script from the project root directory"
    exit 1
  fi
fi

# Check if .next directory exists and clean if necessary
if [ -d ".next" ]; then
  echo -e "${YELLOW}Cleaning Next.js cache...${NC}"
  rm -rf .next
  echo -e "${GREEN}✅ Cache cleared${NC}"
fi

# Get the Next.js version from package.json
NEXT_VERSION=$(grep -o '"next": *"[^"]*"' package.json | grep -o '[0-9.]*')
echo -e "${YELLOW}Using Next.js version: ${NEXT_VERSION}${NC}"

# Run the development server with the correct version
echo -e "${GREEN}Starting Next.js development server...${NC}"
echo -e "Press Ctrl+C to stop the server\n"

# Start the Next.js server with the specific version
npx next@${NEXT_VERSION} dev 