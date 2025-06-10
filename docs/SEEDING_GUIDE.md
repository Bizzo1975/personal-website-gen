# Database Seeding Guide

This guide explains how to use the comprehensive database seeding functionality to create a fully populated development environment.

## Overview

The seeding system provides multiple levels of data initialization for development:

1. **Basic Setup**: Admin user and default pages only
2. **Comprehensive Seeding**: Full database with sample content
3. **Automatic Seeding**: Integrated with startup scripts

## Quick Start

### Option 1: Using Enhanced Startup Script (Recommended)

```bash
# Windows - Full seeded environment
startup-all.bat --force-seed

# Windows - Setup with basic seeding (default)
startup-all.bat

# Windows - Skip all seeding
startup-all.bat --no-seed
```

### Option 2: Manual Seeding Commands

```bash
# Install dependencies first
npm install

# Full comprehensive seeding (clears existing data)
npm run seed:full

# Individual seeding components
npm run seed:admin      # Admin user only
npm run seed:pages      # Default pages only
npm run seed:complete   # Images + full database seeding

# Start development with seeded data
npm run dev:seeded      # Seeds database then starts dev server
```

## What Gets Seeded

### Admin User
- **Email**: `admin@example.com`
- **Password**: `admin12345`
- **Role**: Admin with full access

### Sample Blog Posts (3 posts)
1. **Getting Started with Next.js and TypeScript**
   - Comprehensive tutorial with code examples
   - Tags: Next.js, TypeScript, React, Tutorial

2. **Why I Switched to Tailwind CSS**
   - Personal experience and benefits
   - Tags: CSS, Tailwind CSS, Web Development, Frontend

3. **Building a RESTful API with Node.js and Express**
   - Backend development guide
   - Tags: Node.js, Express, API, Backend, MongoDB

### Sample Projects (4 projects)
1. **E-commerce Platform** (Featured)
   - Full-stack application with payment processing
   - Technologies: Next.js, React, MongoDB, Stripe, Tailwind CSS

2. **Task Management App** (Featured)
   - Productivity tool with real-time features
   - Technologies: React, TypeScript, Redux, Firebase

3. **AI Image Generator** (Featured)
   - AI-powered image generation application
   - Technologies: Python, TensorFlow, FastAPI, React

4. **Weather Dashboard**
   - Responsive weather application
   - Technologies: Vue.js, JavaScript, OpenWeather API

### Default Pages
- **Home Page**: Welcome content with portfolio overview
- **About Page**: Professional background and skills
- **Contact Page**: Contact information and form guidance

### Profile Information
- Personal details and skills
- Social media links
- Professional information

### Images
- Placeholder images for all content
- Option to download real images (if configured)

## Seeding Scripts

### 1. Basic Admin Setup
```bash
npm run seed:admin
```
Creates the admin user only. Safe to run multiple times.

### 2. Default Pages
```bash
npm run seed:pages
```
Creates default pages (Home, About, Contact). Safe to run multiple times.

### 3. Comprehensive Database Seeding
```bash
npm run seed:full
```
**⚠️ Warning**: This clears all existing data and creates a complete sample dataset.

### 4. Complete Setup with Images
```bash
npm run seed:complete
```
Downloads images and runs full database seeding.

## Windows Startup Scripts

### Enhanced Startup Script (`startup-all.bat`)

```bash
# Full startup with forced seeding
startup-all.bat --force-seed

# Standard startup (basic seeding only)
startup-all.bat

# Setup only, no server start
startup-all.bat --setup-only --force-seed

# Production mode
startup-all.bat --prod

# Skip all tests and seeding
startup-all.bat --no-tests --no-seed
```

**Available Flags:**
- `--force-seed`: Force complete database re-seeding
- `--no-seed`: Skip all database seeding
- `--setup-only`: Setup only, don't start server
- `--no-tests`: Skip running tests
- `--prod`: Production mode
- `--help`: Show help information

### Simple Startup Script (`start-windows.bat`)

Includes basic seeding (admin user and pages) and provides development mode options.

## Environment Configuration

### Required Environment Variables

```env
# MongoDB Connection (for real database seeding)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Development Configuration
NODE_ENV=development
MOCK_DATA=true
FRONTEND_PORT=3006
```

### Mock Data Mode

If no `MONGODB_URI` is provided or `MOCK_DATA=true`, the application will use:
- Built-in mock data for all content types
- File-based storage for development
- Automatic sample content generation

## Database Considerations

### MongoDB Seeding
- Requires valid `MONGODB_URI` in `.env.local`
- Clears existing data before seeding (with `--force-seed`)
- Creates proper relationships between content

### Mock Data Mode
- No database required
- Uses in-memory storage with file persistence
- Includes all sample content types
- Perfect for development without database setup

## Development Workflows

### New Project Setup
```bash
# Clone repository
git clone <repository-url>
cd personal-website-gen

# Full setup with seeded environment
startup-all.bat --force-seed
```

### Daily Development
```bash
# Quick start with existing data
startup-all.bat

# Or start specific mode
npm run dev:mock:windows
```

### Clean Development Environment
```bash
# Reset everything and start fresh
startup-all.bat --force-seed
```

### Production Deployment
```bash
# Build for production
startup-all.bat --prod
```

## Troubleshooting

### Database Connection Issues
If seeding fails due to database connection:
1. Check `MONGODB_URI` in `.env.local`
2. Verify internet connection
3. Use mock data mode: `set MOCK_DATA=true`

### Seeding Script Errors
```bash
# Check Node.js version (requires v18+)
node --version

# Verify dependencies
npm install

# Test database connection
node testing/test-db-connection.js
```

### Windows-Specific Issues
- Ensure proper line endings (CRLF)
- Run Command Prompt as Administrator if needed
- Use Windows-specific scripts: `startup-all.bat`

## Sample Login Credentials

After seeding, use these credentials to access the admin panel:

- **URL**: http://localhost:3006/admin
- **Email**: admin@example.com
- **Password**: admin12345

## Content Management

Once seeded, you can:
1. Edit blog posts through the admin panel
2. Add/modify projects
3. Update profile information
4. Customize page content
5. Upload new images

All changes are preserved between development sessions (with database mode) or stored in local files (with mock mode).

## Advanced Configuration

### Custom Seeding Data

To customize the seeded content, edit:
- `scripts/setup/seed-full-database.js` - Main seeding script
- `src/lib/seed-data.js` - Alternative seeding approach
- Individual scripts in `scripts/setup/` directory

### Database Switching

The system supports both MongoDB and mock data:
- Set `MONGODB_URI` for database mode
- Set `MOCK_DATA=true` for file-based mode
- Leave `MONGODB_URI` empty for automatic mock mode

This flexible seeding system ensures you can quickly set up a fully functional development environment regardless of your database setup! 