# Scripts Directory

This directory contains all deployment, maintenance, and utility scripts for the personal website.

## Essential Production Scripts

### `rebuild-and-start-production.sh`
**THE MAIN SCRIPT TO USE** - Rebuilds and starts the entire production environment.
- Builds the app container
- Starts all services (db, redis, app, nginx)
- Verifies health
- Tests the website

**Usage:**
```bash
./scripts/rebuild-and-start-production.sh
```

### `start-docker-compose.sh`
Wrapper script for docker-compose used by systemd service.
- Loads environment variables
- Cleans up old containers
- Starts services

**Note:** This is used by the systemd service, not called directly.

### `docker-entrypoint.sh`
Docker entrypoint script required for the app container.
- Ensures Next.js binds to 0.0.0.0
- Required for Docker deployment

**Note:** This is used by Docker, not called directly.

## Utility Scripts

### `test-api-endpoints-now.sh`
Test API endpoints without rebuilding.
```bash
./scripts/test-api-endpoints-now.sh
```

### `quick-memory-check.sh`
Quick overview of system and Docker memory usage.
```bash
./scripts/quick-memory-check.sh
```

### `cleanup-before-restart.sh`
Clean up Docker resources before server restart.
```bash
./scripts/cleanup-before-restart.sh
```

### `safe-server-restart.sh`
Safely restart the server without data loss.
```bash
./scripts/safe-server-restart.sh
```

### `fix-script-permissions.sh`
Fix Windows line endings and set executable permissions.
```bash
./scripts/fix-script-permissions.sh
```

## Organized Subdirectories

### `02-migration/`
Migration scripts for data export/import.

### `03-server-setup/`
Initial server setup and dependency installation.

### `04-deployment/`
Application deployment scripts.

### `05-backup-restore/`
Backup and restore scripts.

### `06-maintenance/`
Maintenance and health check scripts.

### `archive/`
Archived scripts (Windows batch files, etc.).

### `deployment/`
Additional deployment utilities.

## Quick Reference

**To rebuild and start production:**
```bash
cd /opt/app/site
./scripts/rebuild-and-start-production.sh
```

**To test APIs:**
```bash
./scripts/test-api-endpoints-now.sh
```

**To check memory:**
```bash
./scripts/quick-memory-check.sh
```

**To safely restart server:**
```bash
./scripts/safe-server-restart.sh
```
