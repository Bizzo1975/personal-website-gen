# Port Configuration Guide

## Updated Port Configuration

The codebase has been updated to use the following standardized ports:

| Service | Port | Previous Port | Description |
|---------|------|---------------|-------------|
| **Frontend** | `3007` | `3006` | Next.js development server |
| **Backend** | `4007` | `4006` | API backend services |
| **PostgreSQL** | `5437` | `5436` | Database server |
| **pgAdmin** | `8080` | `8080` | Database management (Docker only) |

## Environment Configuration

### .env.local
```bash
# Port Configuration
FRONTEND_PORT=3007
BACKEND_PORT=4007
DATABASE_PORT=5437

# Base URLs
FRONTEND_URL=http://localhost:3007
BACKEND_URL=http://localhost:4007
API_URL=http://localhost:3007/api

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3007
NEXTAUTH_URL_INTERNAL=http://localhost:3007
NEXTAUTH_SECRET=development-secret-key-12345678901234567890123456789012

# Database Configuration
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5437
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-postgres-password
DATABASE_URL=postgresql://postgres:your-postgres-password@localhost:5437/personal_website

# Development Settings
NODE_ENV=development
MOCK_DATA=true
```

## Access URLs

### Development Environment
- **Frontend**: http://localhost:3007
- **Admin Panel**: http://localhost:3007/admin
- **API Endpoints**: http://localhost:3007/api/*

### Docker Environment
- **Frontend**: http://localhost:3007
- **PostgreSQL**: localhost:5437
- **pgAdmin**: http://localhost:8080

## Updated Files

### Configuration Files
- ✅ `package.json` - All npm scripts updated
- ✅ `docker-compose.yml` - Container port mappings
- ✅ `.env.local` - Environment variables
- ✅ `env.example` - Template file
- ✅ `src/lib/config.ts` - Application configuration

### Startup Scripts
- ✅ `startup-all-fixed.bat` - Main startup script
- ✅ `startup-all.bat` - Legacy startup script
- ✅ `quick-start.bat` - Quick development start
- ✅ `start-windows.bat` - Windows setup script
- ✅ `start-windows-clean.bat` - Clean startup
- ✅ `start-debug.bat` - Debug startup
- ✅ `start-simple.bat` - Simple startup

### Testing & Scripts
- ✅ `testing/cypress.config.ts` - E2E test configuration
- ✅ `testing/unit/api/auth.test.ts` - Unit test URLs
- ✅ `scripts/run-lighthouse.js` - Performance testing
- ✅ `scripts/check-accessibility.js` - Accessibility testing
- ✅ `scripts/maintenance/debug-api.js` - API debugging
- ✅ `scripts/setup/seed-full-database.js` - Database seeding

## Migration Commands

### Start Development Server
```bash
# Quick start (recommended)
quick-start.bat

# Full startup with seeding
startup-all-fixed.bat --force-seed

# Manual start
npm run dev:mock:windows
```

### Docker Development
```bash
# Start Docker environment
npm run dev:docker

# Stop Docker environment
npm run docker:stop
```

### Testing
```bash
# Run tests
npm run test:e2e

# Performance audit
npm run performance:audit

# Accessibility check
npm run a11y:audit
```

## Login Credentials

### Admin Access
- **Email**: admin@example.com
- **Password**: admin12345
- **Admin Panel**: http://localhost:3007/admin

### Database Access (Docker)
- **pgAdmin URL**: http://localhost:8080
- **Email**: admin@example.com
- **Password**: admin

## Troubleshooting

### Port Conflicts
If you encounter port conflicts:

1. **Check running processes**:
   ```bash
   netstat -ano | findstr :3007
   ```

2. **Kill stuck Node processes**:
   ```bash
   taskkill /f /im node.exe
   ```

3. **Use alternative ports** (if needed):
   - Update `FRONTEND_PORT` in `.env.local`
   - Restart development server

### Environment Issues
1. **Recreate .env.local**:
   ```bash
   del .env.local
   copy env.example .env.local
   ```

2. **Clear cache**:
   ```bash
   rmdir /s /q .next
   npm run dev
   ```

## Verification Checklist

- [ ] Frontend accessible at http://localhost:3007
- [ ] Admin panel accessible at http://localhost:3007/admin
- [ ] API endpoints responding at http://localhost:3007/api/test
- [ ] Database connection working (if using PostgreSQL)
- [ ] All startup scripts use correct ports
- [ ] Tests pass with new configuration
- [ ] Docker environment works with new ports

## Notes

- **Mock Data Mode**: Enabled by default for development
- **Database**: PostgreSQL is the primary database, MongoDB available as alternative
- **Windows Compatibility**: All scripts optimized for Windows development
- **Docker Support**: Full Docker environment with PostgreSQL and pgAdmin

---

**Last Updated**: 2025-05-31  
**Configuration Version**: 2.0  
**Ports**: Frontend 3007, Backend 4007, Database 5437 