# Troubleshooting Guide - Backend Loading Issues

## Issue Summary
**Problem**: Application stuck on loading screen with backend not responding
**Root Cause**: Port conflict and corrupted environment configuration
**Status**: ✅ RESOLVED

## Root Cause Analysis

### Primary Issues Identified:

1. **Port Conflict (EADDRINUSE)**
   - Port 3006 was already in use by another process
   - Multiple Node.js processes were running simultaneously
   - Server couldn't start due to port binding failure

2. **Corrupted .env.local File**
   - Environment file had formatting issues and broken configuration
   - NextAuth configuration was incomplete
   - Port references were inconsistent

3. **Stuck Node.js Processes**
   - Multiple Node.js processes were running in background
   - Previous development sessions weren't properly terminated
   - Processes were holding onto ports even after apparent shutdown

## Solution Implemented

### Step 1: Process Cleanup
```bash
# Kill all Node.js processes
taskkill /f /im node.exe

# Verify no processes are running
tasklist | findstr node
```

### Step 2: Environment Configuration Fix
```bash
# Remove corrupted .env.local
del .env.local

# Create clean configuration
echo FRONTEND_PORT=3007 > .env.local
echo NEXTAUTH_URL=http://localhost:3007 >> .env.local
echo NEXTAUTH_SECRET=development-secret-key-12345678901234567890123456789012 >> .env.local
echo NODE_ENV=development >> .env.local
echo MOCK_DATA=true >> .env.local
```

### Step 3: Port Migration
- **Changed from**: Port 3006 → **Changed to**: Port 3007
- Updated all configuration files:
  - `package.json` scripts
  - `startup-all-fixed.bat`
  - `quick-start.bat`
  - `.env.local`

### Step 4: Verification
```bash
# Test server startup
npm run dev

# Verify API response
curl http://localhost:3007/api/test

# Check port binding
netstat -ano | findstr :3007
```

## Current Working Configuration

### Environment Variables (.env.local)
```
FRONTEND_PORT=3007
NEXTAUTH_URL=http://localhost:3007
NEXTAUTH_SECRET=development-secret-key-12345678901234567890123456789012
NODE_ENV=development
MOCK_DATA=true
```

### Access URLs
- **Frontend**: http://localhost:3007
- **Admin Panel**: http://localhost:3007/admin
- **API Test**: http://localhost:3007/api/test

### Login Credentials
- **Email**: admin@example.com
- **Password**: admin12345

## Startup Scripts Updated

### Quick Start (Recommended)
```bash
quick-start.bat
```

### Full Startup with Seeding
```bash
startup-all-fixed.bat --force-seed
```

### Manual Startup
```bash
npm run dev:mock
```

## Prevention Measures

### 1. Proper Shutdown
Always use `Ctrl+C` to stop development server properly

### 2. Process Monitoring
```bash
# Check for running Node processes
tasklist | findstr node

# Check port usage
netstat -ano | findstr :3007
```

### 3. Environment Validation
Verify `.env.local` file integrity before starting:
```bash
type .env.local
```

### 4. Port Conflict Resolution
If port conflicts occur:
```bash
# Find process using port
netstat -ano | findstr :3007

# Kill specific process by PID
taskkill /f /pid [PID_NUMBER]
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] API endpoints respond correctly
- [ ] Admin authentication works
- [ ] Frontend loads properly
- [ ] No console errors in browser
- [ ] Database connection (mock mode) functional

## Common Error Messages

### "EADDRINUSE: address already in use"
**Solution**: Kill existing Node processes and restart

### "Loading..." screen stuck
**Solution**: Check backend API connectivity and authentication

### "Failed to start server"
**Solution**: Verify environment configuration and port availability

## Additional Resources

- **Project Documentation**: `docs/PROJECT_PLAN.md`
- **Seeding Guide**: `docs/SEEDING_GUIDE.md`
- **API Documentation**: Check `/api/test` endpoint for health status

---

**Last Updated**: 2025-05-31
**Status**: Backend fully operational on port 3007
**Next Steps**: Continue development with stable environment 