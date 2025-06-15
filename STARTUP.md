# Automated Development Environment Startup

## Quick Start

The development environment has been completely automated. No user interaction required!

### Windows
```bash
startup-all.bat
```

### Unix/Linux/macOS
```bash
./startup-all.sh
```

## What the Script Does Automatically

1. **🧹 Environment Cleanup**
   - Kills all existing Node.js and npm processes
   - Closes all development ports (3000-3006, 8000, 8080, 5000, 5432-5435)
   - Stops and removes all Docker containers
   - Cleans build cache and temporary files

2. **📦 Dependencies Management**
   - Installs dependencies (first time) or updates them
   - Handles errors gracefully

3. **⚙️ Environment Configuration**
   - Creates `.env.local` from template or with default values
   - Sets up all required environment variables

4. **🖼️ Assets & Images Setup**
   - Downloads and sets up all placeholder images
   - Ensures all assets are properly configured

5. **🌱 Database Seeding**
   - Seeds the development database with full content
   - Includes sample blog posts, projects, users, and newsletter data

6. **🚀 Development Server**
   - Starts the fully seeded development environment
   - Available at http://localhost:3006
   - Admin panel at http://localhost:3006/admin

## Features Enabled

✅ **Mock data with full content**  
✅ **Newsletter system with sample data**  
✅ **Blog posts and projects**  
✅ **Contact forms and user management**  
✅ **All admin features functional**  

## Default Credentials

- **Admin Email**: admin@example.com
- **Admin Password**: admin12345

## Stopping the Server

Press `Ctrl+C` in the terminal to stop the development server.

## Manual Commands (if needed)

```bash
# Start development with seeded data
npm run dev:seeded

# Start with mock data only
npm run dev:mock

# Setup all assets and seed data
npm run seed:complete

# Setup images only
npm run setup:images
```

## Troubleshooting

If the startup script fails:

1. Ensure you're in the project root directory
2. Check that Node.js and npm are installed
3. Run `npm install` manually if dependencies fail
4. Check console output for specific error messages

The script is designed to handle most common issues automatically and continue with fallback options. 