# Troubleshooting Guide

## Directory Structure Issues

This project has a slightly confusing directory structure with a nested "Website" folder:
```
/home/webuidb/Projects/Website/          <-- Parent directory
/home/webuidb/Projects/Website/Website/  <-- Actual project directory
```

To avoid confusion, use the following scripts:
- From parent directory: `./run-project.sh`
- From project directory: `./scripts/run-dev.sh`

These scripts will automatically:
1. Navigate to the correct directory
2. Clear the Next.js cache
3. Start the server with the correct version

## 404 Not Found Errors

If you're experiencing 404 errors for all routes or specific pages, follow these steps:

### General 404 Fix

Run the 404 fix script:
```bash
./scripts/maintenance/fix-404.sh
```

This script will:
1. Clean the Next.js cache
2. Create a proper not-found.tsx page
3. Ensure root layout exists
4. Update Next.js configuration
5. Create a test page to verify routing

### Common 404 Causes

1. **Missing Root Layout**
   - Next.js requires a root layout.tsx in src/app

2. **Next.js Cache Issues**
   - Clear cache completely: `rm -rf .next && rm -rf node_modules/.cache`

3. **Dynamic Route Problems**
   - Check that [slug] folders have proper page.tsx files
   - Verify generateStaticParams is properly implemented for dynamic routes

4. **MongoDB Connection Issues**
   - If pages are fetched from the database, connection failures can cause 404s
   - Run `node scripts/maintenance/debug-admin-pages.js` to check database content

5. **Not-Found Implementation**
   - Ensure not-found.tsx exists in src/app
   - Verify notFound() is properly used in dynamic routes

### Next.js Routing Debugging

1. Create a simple test page:
```bash
mkdir -p src/app/test
echo 'export default function Test() { return <div>Test page</div>; }' > src/app/test/page.tsx
```

2. Restart the server and visit http://localhost:3000/test
   
3. Check server logs for routing errors

## Next.js Issues

### Error: Cannot find module 'next/dist/server/app-render/work-async-storage.external.js'

This error occurs when there's a mismatch between the Next.js version used to build the project and the one used to run it. In our case, this happened when trying to use Next.js 15.3.1 with a project built for Next.js 14.0.3.

#### Solution:

1. Clear the Next.js cache:
   ```bash
   rm -rf .next
   ```

2. Use the correct Next.js version (as specified in package.json):
   ```bash
   npx next@14.0.3 dev
   ```
   
3. Run the provided fix script:
   ```bash
   ./scripts/maintenance/fix-nextjs.sh
   ```

4. Make sure your package.json "dev" script includes cache clearing:
   ```json
   "scripts": {
     "dev": "rimraf .next && next dev",
     ...
   }
   ```

5. Use the new convenience scripts:
   ```bash
   # From project root
   ./scripts/run-dev.sh
   
   # From parent directory
   ./run-project.sh
   ```

#### Prevention:

- Always use the Next.js version specified in package.json
- Avoid running `npx next dev` without specifying a version
- Use `npm run dev` which will use the correct version from dependencies
- If you update Next.js, make sure to update all related packages

## MongoDB Connection Issues

If you encounter issues connecting to MongoDB, see [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed troubleshooting steps.

## Authentication Issues

For NextAuth.js configuration and troubleshooting, refer to [NEXTAUTH_SETUP.md](./NEXTAUTH_SETUP.md).

## Admin Dashboard Issues

For issues with the admin dashboard pages, see [ADMIN_PAGES_TROUBLESHOOTING.md](./ADMIN_PAGES_TROUBLESHOOTING.md). 