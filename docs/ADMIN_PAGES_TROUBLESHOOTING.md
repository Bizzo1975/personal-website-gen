# Admin Pages Troubleshooting Guide

This document provides guidance for troubleshooting issues with the admin dashboard and editable pages functionality.

## Authentication Issues

If you're having trouble logging in or accessing the admin dashboard, follow these steps:

1. **Check NextAuth Configuration**
   - Ensure you have a `.env.local` file with the required environment variables:
     ```
     NEXTAUTH_SECRET="your-secret-key"
     NEXTAUTH_URL="http://localhost:3000"
     ```
   - Run `./scripts/maintenance/fix-nextauth.sh` to automatically set up these variables

2. **Verify Admin User Exists**
   - Run `node scripts/setup/init-admin.js` to create/reset the admin user
   - Default credentials are: admin@example.com / admin12345

3. **Troubleshoot Middleware**
   - The middleware might be blocking access to login pages
   - Make sure `/admin/login` and `/admin/signup` are allowed without authentication
   - Run `node scripts/maintenance/debug-auth.js` to check authentication setup

4. **Clear Browser Data**
   - Clear cookies and local storage in your browser
   - Try using an incognito/private window

5. **Restart the Server**
   - Env variables are loaded at startup, so restart is required after changes
   - Run `./scripts/run-dev.sh` to restart with proper configuration

## Common Issues and Solutions

### Home and About Pages Not Showing in Admin Dashboard

If you're not seeing pages in the admin dashboard, follow these steps:

1. **Check Database Connection**
   - Ensure MongoDB is properly connected
   - Verify the connection string in `src/lib/db.ts`
   - Run `node scripts/maintenance/debug-admin-pages.js` to check database content

2. **Verify Pages Exist in Database**
   - Run `node scripts/setup/init-pages.js` to create/update home and about pages
   - Check if pages are returned by `node scripts/maintenance/debug-api.js`

3. **API Endpoint Testing**
   - Ensure the Next.js server is running (`npx next dev`)
   - Test the API directly: `curl http://localhost:3000/api/pages`
   - Check browser console for network errors

4. **Authentication Issues**
   - Verify admin user exists: `node scripts/setup/init-admin.js`
   - Test login with admin credentials (admin@example.com / admin12345)
   - Check NextAuth configuration in `src/app/api/auth/[...nextauth]/route.ts`

### Fixes Applied

We've made several improvements to ensure the admin pages functionality works correctly:

1. **Direct API Calls**: Modified the admin pages component to use direct fetch API calls instead of service functions, which can have scoping issues in the browser context.

2. **Enhanced Error Handling**: Added better error handling and logging to diagnose issues.

3. **Authentication Verification**: Ensured the admin user exists and has proper credentials.

4. **Database Initialization**: Set up scripts to ensure the home and about pages exist in the database.

5. **NextAuth Configuration**: Fixed environment variables and middleware to properly handle authentication.

## Running the Fix Script

We've created a comprehensive fix script that addresses most common issues:

```bash
./scripts/maintenance/fix-admin-pages.sh
```

This script will:
- Check MongoDB connection
- Ensure admin user exists
- Initialize home and about pages
- Verify critical files exist
- Apply necessary fixes to admin pages components

## Manual Testing

After running the fix script, follow these steps to verify everything is working:

1. Start the Next.js server: `./scripts/run-dev.sh`
2. Open your browser and navigate to: `http://localhost:3000/admin/login`
3. Log in with admin credentials: admin@example.com / admin12345
4. After login, navigate to: `http://localhost:3000/admin/pages`
5. Verify that home and about pages are listed
6. Try editing a page to ensure changes save correctly

## Debugging Tools

These scripts can help diagnose issues:

- `scripts/maintenance/debug-admin-pages.js` - Check database and page contents
- `scripts/maintenance/debug-api.js` - Test API endpoints directly
- `scripts/maintenance/debug-auth.js` - Check authentication configuration
- `scripts/setup/init-pages.js` - Initialize/reset home and about pages
- `scripts/setup/init-admin.js` - Initialize/reset admin user 