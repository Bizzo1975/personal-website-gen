#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== NextAuth Configuration Fix Script ===${NC}"
echo "This script will set up NextAuth.js correctly."

# Check if .env.local exists
if [ -f ".env.local" ]; then
  echo -e "\n${YELLOW}Found existing .env.local file${NC}"
  
  # Check if NEXTAUTH_SECRET exists in .env.local
  if grep -q "NEXTAUTH_SECRET" .env.local; then
    echo -e "${GREEN}NEXTAUTH_SECRET already exists in .env.local${NC}"
  else
    echo -e "${YELLOW}Adding NEXTAUTH_SECRET to .env.local...${NC}"
    # Generate a random secret
    RANDOM_SECRET=$(openssl rand -base64 32)
    echo "NEXTAUTH_SECRET=\"${RANDOM_SECRET}\"" >> .env.local
    echo -e "${GREEN}✅ Added NEXTAUTH_SECRET to .env.local${NC}"
  fi
else
  echo -e "\n${YELLOW}Creating .env.local file...${NC}"
  # Generate a random secret
  RANDOM_SECRET=$(openssl rand -base64 32)
  
  # Create .env.local with NEXTAUTH_SECRET
  cat > .env.local << EOF
# Environment Variables
NEXTAUTH_SECRET="${RANDOM_SECRET}"
NEXTAUTH_URL="http://localhost:3000"
EOF
  
  echo -e "${GREEN}✅ Created .env.local with NEXTAUTH_SECRET${NC}"
fi

# Set up NEXTAUTH_URL if needed
if ! grep -q "NEXTAUTH_URL" .env.local; then
  echo -e "${YELLOW}Adding NEXTAUTH_URL to .env.local...${NC}"
  echo "NEXTAUTH_URL=\"http://localhost:3000\"" >> .env.local
  echo -e "${GREEN}✅ Added NEXTAUTH_URL to .env.local${NC}"
fi

echo -e "\n${GREEN}=== NextAuth Fix Complete ===${NC}"
echo "Your NextAuth.js configuration has been updated."
echo "You need to restart your Next.js server for these changes to take effect."
echo ""
echo "To restart your server, run:"
echo "./scripts/run-dev.sh"
echo ""
echo "If you're still experiencing issues:"
echo "1. Check browser console for errors"
echo "2. Verify middleware.ts configuration"
echo "3. Try clearing browser cookies and localStorage" 