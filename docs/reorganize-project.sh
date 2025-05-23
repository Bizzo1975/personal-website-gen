#!/bin/bash

# Script to reorganize the project structure
# Fix duplicate directories and organize scripts

set -e  # Exit on error

echo "Starting project reorganization..."

# Create scripts directory
mkdir -p scripts/setup
mkdir -p scripts/testing
mkdir -p scripts/maintenance

# Move script files to appropriate directories
echo "Organizing scripts..."

# Setup scripts
mv setup.sh scripts/setup/ 2>/dev/null || echo "setup.sh not found"
mv init-db-env.js scripts/setup/ 2>/dev/null || echo "init-db-env.js not found"
mv init-pages.js scripts/setup/ 2>/dev/null || echo "init-pages.js not found"

# Testing scripts
mv test-*.js scripts/testing/ 2>/dev/null || echo "No test-*.js files found"
mv check-*.js scripts/testing/ 2>/dev/null || echo "No check-*.js files found"
mv test-db-connection.js scripts/testing/ 2>/dev/null || echo "test-db-connection.js not found"
mv check-db-connection.js scripts/testing/ 2>/dev/null || echo "check-db-connection.js not found"

# Maintenance scripts
mv fix-*.sh scripts/maintenance/ 2>/dev/null || echo "No fix-*.sh files found"
mv make-pages-editable.sh scripts/maintenance/ 2>/dev/null || echo "make-pages-editable.sh not found"

# Check if source directory is a duplicate
if [ -d "../../src" ] && [ -d "src" ]; then
  echo "Detected duplicate src directory. Comparing files..."
  
  # Create a temp directory for comparison
  mkdir -p ../../temp

  # Find unique files in Website/src that aren't in ../../src
  find src -type f | while read file; do
    rel_path="${file#src/}"
    if [ ! -f "../../src/$rel_path" ]; then
      # Found a unique file
      mkdir -p $(dirname "../../temp/$rel_path")
      cp "$file" "../../temp/$rel_path"
      echo "Found unique file: $file"
    fi
  done

  # Check if we found any unique files
  if [ "$(find ../../temp -type f | wc -l)" -gt 0 ]; then
    echo "Found unique files in Website/src that need to be merged with ../../src"
    echo "Merging files..."
    
    # Copy unique files to ../../src
    find ../../temp -type f | while read file; do
      rel_path="${file#../../temp/}"
      mkdir -p $(dirname "../../src/$rel_path")
      cp "$file" "../../src/$rel_path"
      echo "Merged: $rel_path"
    done
  fi

  # Clean up temp directory
  rm -rf ../../temp
  
  echo "Duplicate src directory handled."
else
  echo "No duplicate src directory detected."
fi

# Create a README for the scripts directory
cat > scripts/README.md << 'EOL'
# Scripts

This directory contains utility scripts organized by function.

## Setup Scripts

Scripts for initializing and setting up the project:

- `setup.sh` - Main setup script for the project
- `init-db-env.js` - Sets up database environment variables
- `init-pages.js` - Initializes required pages in the database

## Testing Scripts

Scripts for testing various aspects of the project:

- `test-db-connection.js` - Tests the database connection
- `test-admin-user.js` - Tests admin user functionality
- `test-pages.js` - Tests pages functionality
- `check-admin-pages.js` - Checks admin pages
- `check-db-connection.js` - Checks database connection
- `check-nextauth.sh` - Checks NextAuth configuration

## Maintenance Scripts

Scripts for fixing and maintaining the project:

- `fix-admin-pages.sh` - Fixes admin pages functionality
- `fix-env.sh` - Fixes environment variables
- `fix-layout.sh` - Fixes layout issues
- `fix-models.sh` - Fixes model issues
- `fix-styling.sh` - Fixes styling issues
- `fix-styling-and-pages.sh` - Fixes styling and pages issues
- `make-pages-editable.sh` - Makes pages editable
EOL

# Create env.example file
echo "Creating env.example file..."
cat > .env.example << 'EOL'
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/personal-website

# Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password_immediately

# Optional: AWS S3 for media storage
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# S3_BUCKET_NAME=
EOL

# Create GitHub Actions workflow for CI/CD
echo "Creating GitHub Actions workflow..."
mkdir -p .github/workflows

cat > .github/workflows/ci.yml << 'EOL'
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint

  build:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
        
  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
EOL

echo "Project reorganization complete!"
echo "Next steps:"
echo "1. Update import paths in code if needed"
echo "2. Commit changes to version control"
echo "3. Set up GitHub Actions secrets for deployment"

exit 0 