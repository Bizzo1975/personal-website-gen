# Deployment & Migration Scripts

This directory contains all scripts needed for deployment, migration, and maintenance of the Personal Website project.

## 📁 Directory Structure

```
scripts/
├── README.md                    # This file
├── DEPLOYMENT_GUIDE.md          # Comprehensive deployment guide
├── SCRIPTS_OVERVIEW.md          # Detailed script documentation
├── run-full-deployment.sh       # Complete deployment orchestrator (Linux/macOS)
├── run-full-deployment.bat      # Complete deployment orchestrator (Windows)
├── 02-migration/               # Data migration scripts
│   └── export-dev-data.sh      # Export development data
├── 03-server-setup/           # Production server setup
│   ├── initial-server-setup.sh
│   └── install-dependencies.sh
├── 04-deployment/             # Application deployment
│   └── deploy-application.sh
├── 05-backup-restore/         # Backup and restore operations
│   ├── backup-full-system.sh
│   └── backup-full-system.bat
└── 06-maintenance/           # Ongoing maintenance
    └── health-check.sh
```

## 🚀 Quick Start Deployment

### For Complete First-Time Deployment:

```bash
# Windows
scripts\run-full-deployment.bat

# Linux/macOS  
scripts/run-full-deployment.sh
```

### For Data Migration Only:

```bash
# Export development data
scripts/02-migration/export-dev-data.sh
```

## 📋 Script Categories

### 1. Main Orchestrators
- **run-full-deployment.sh/.bat**: Complete deployment orchestrator with interactive setup
- **DEPLOYMENT_GUIDE.md**: Comprehensive deployment documentation
- **SCRIPTS_OVERVIEW.md**: Detailed script documentation and usage

### 2. Migration Scripts (`02-migration/`)
- **export-dev-data.sh**: Export development database and content

### 3. Server Setup Scripts (`03-server-setup/`)
- **initial-server-setup.sh**: Configure new Digital Ocean droplet
- **install-dependencies.sh**: Install Docker, Node.js, tools

### 4. Deployment Scripts (`04-deployment/`)
- **deploy-application.sh**: Deploy app to production server

### 5. Backup & Restore Scripts (`05-backup-restore/`)
- **backup-full-system.sh/.bat**: Complete system backup (DB + content + config)

### 6. Maintenance Scripts (`06-maintenance/`)
- **health-check.sh**: Check system health and performance

## 🔧 Prerequisites

### Development Environment:
- Node.js 18+
- Docker Desktop
- Git
- PostgreSQL tools (pg_dump, psql)

### Production Server:
- Digital Ocean Droplet (Ubuntu 22.04 LTS)
- 4 vCPUs, 8GB RAM (recommended)
- CloudFlare account with domain
- SSH access configured

## 📖 Usage Examples

### Complete Deployment Pipeline:
```bash
# Windows
scripts\run-full-deployment.bat

# Linux/macOS
scripts/run-full-deployment.sh
```

### Manual Deployment Steps:
```bash
# 1. Setup production server
scripts/03-server-setup/initial-server-setup.sh

# 2. Install dependencies
scripts/03-server-setup/install-dependencies.sh

# 3. Export development data
scripts/02-migration/export-dev-data.sh

# 4. Deploy application
scripts/04-deployment/deploy-application.sh

# 5. Setup automated backups
scripts/05-backup-restore/backup-full-system.sh
```

### Ongoing Maintenance:
```bash
# Health check
scripts/06-maintenance/health-check.sh

# System backup
scripts/05-backup-restore/backup-full-system.sh
```

## 🔐 Security Considerations

All scripts include:
- Input validation and error handling
- Secure credential handling
- Backup before destructive operations
- Logging of all operations
- Rollback procedures where applicable

## 📞 Support

If you encounter issues:
1. Check script logs in `/var/log/deployment/`
2. Review the main `DEPLOYMENT_PLAN.md`
3. Use the health check script: `scripts/06-maintenance/health-check.sh`

## 🔄 Version Control

All scripts are version controlled and include:
- Change logging
- Rollback capabilities
- Validation checks
- Progress indicators 