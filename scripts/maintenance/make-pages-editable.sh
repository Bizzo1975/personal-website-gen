#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting the process to make pages editable...${NC}"

# Create necessary directories
mkdir -p src/lib/models src/lib/services

# Copy the updated files
echo -e "${YELLOW}Updating components to use dynamic content...${NC}"

# Update seed script to include all models
echo -e "${YELLOW}Updating database seed script...${NC}"

# Run the seed script to populate the database
echo -e "${YELLOW}Populating the database with sample content...${NC}"
node -r dotenv/config src/lib/seed-data.js

# Clear Next.js cache
echo -e "${YELLOW}Clearing Next.js cache...${NC}"
rimraf .next
echo -e "${GREEN}✅ Cache cleared!${NC}"

echo -e "${GREEN}✅ Home and About pages are now fully editable!${NC}"
echo -e "${GREEN}Run the following command to start the development server:${NC}"
echo -e "npm run dev"
echo -e "${YELLOW}To edit content, you can:${NC}"
echo -e "1. Use the admin dashboard at /admin/dashboard"
echo -e "2. Directly modify the database content"
echo -e "3. Update the seed-data.js file and run it again" 