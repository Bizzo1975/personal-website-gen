# Complete Deployment Guide for Personal Website

This guide provides step-by-step instructions for deploying the Personal Website to production using the provided scripts.

## 🎯 Overview

The deployment process includes:
- **Development Environment**: Next.js 14 with PostgreSQL on Windows/Docker
- **Production Environment**: Digital Ocean Droplet + CloudFlare DNS
- **Domain**: willworkforlunch.com
- **Architecture**: Docker containers with Nginx reverse proxy

## 📋 Prerequisites

### Development Environment
- ✅ Windows 10/11 with Docker Desktop
- ✅ Node.js 18+ and npm
- ✅ PostgreSQL client tools (pg_dump, psql)
- ✅ Git and SSH configured
- ✅ Working development environment

### Production Environment
- ✅ Digital Ocean Droplet (Ubuntu 22.04 LTS)
- ✅ Minimum: 4 vCPUs, 8GB RAM, 160GB SSD
- ✅ CloudFlare account with domain configured
- ✅ SSH key access to server

### Required Information
- 🔑 Production server IP/hostname
- 🔑 Development database credentials
- 🔑 Domain name and admin email
- 🔑 SMTP configuration for emails

## 🚀 Quick Start (Full Deployment)

For a complete first-time deployment:

### Windows:
```cmd
cd /path/to/personal-website-gen
scripts\run-full-deployment.bat
```

### Linux/macOS:
```bash
cd /path/to/personal-website-gen
scripts/run-full-deployment.sh
```

The script will guide you through:
1. Configuration input
2. Server setup and security
3. Data migration
4. Application deployment
5. SSL and DNS configuration
6. Backup setup

## 📖 Step-by-Step Manual Deployment

If you prefer manual control or need to troubleshoot, follow these steps:

### Phase 1: Server Setup (Production Server)

```bash
# 1. Initial server configuration
ssh root@your-server-ip
scripts/03-server-setup/initial-server-setup.sh

# 2. Install dependencies
scripts/03-server-setup/install-dependencies.sh

# 3. Configure security
scripts/03-server-setup/configure-security.sh

# 4. Setup SSL certificates
scripts/03-server-setup/setup-ssl.sh
```

### Phase 2: Data Migration (Development Environment)

```cmd
# Windows - Export development data
scripts\02-migration\export-dev-data.bat

# Validate export
scripts\02-migration\validate-export.bat
```

```bash
# Linux/macOS - Export development data
scripts/02-migration/export-dev-data.sh

# Validate export
scripts/02-migration/validate-export.sh
```

### Phase 3: Application Deployment (Production Server)

```bash
# 1. Deploy application
scripts/04-deployment/deploy-application.sh

# 2. Configure Nginx
scripts/04-deployment/configure-nginx.sh

# 3. Import migrated data
scripts/02-migration/import-to-production.sh
```

### Phase 4: Backup and Monitoring Setup

```bash
# 1. Setup automated backups
scripts/05-backup-restore/setup-automated-backups.sh

# 2. Configure monitoring
scripts/06-maintenance/health-check.sh
```

## 🔄 Common Operations

### Data Migration Only
```cmd
# Windows
scripts\02-migration\run-migration.bat
```

```bash
# Linux/macOS
scripts/02-migration/run-migration.sh
```

### Application Update (No Data Migration)
```bash
# Production server
scripts/04-deployment/deploy-application.sh
```

### System Backup
```bash
# Production server
scripts/05-backup-restore/backup-full-system.sh
```

### Health Check
```bash
# Production server
scripts/06-maintenance/health-check.sh
```

## 📁 Script Directory Structure

```
scripts/
├── README.md                      # Script documentation
├── DEPLOYMENT_GUIDE.md            # This guide
├── run-full-deployment.sh/.bat    # Main orchestrator scripts
│
├── 01-development/                 # Development environment scripts
│   ├── setup-dev-environment.sh/.bat
│   ├── reset-development.sh/.bat
│   └── dev-backup.sh/.bat
│
├── 02-migration/                   # Data migration scripts
│   ├── export-dev-data.sh/.bat
│   ├── validate-export.sh/.bat
│   ├── import-to-production.sh
│   └── run-migration.sh/.bat
│
├── 03-server-setup/               # Production server setup
│   ├── initial-server-setup.sh
│   ├── install-dependencies.sh
│   ├── configure-security.sh
│   └── setup-ssl.sh
│
├── 04-deployment/                 # Application deployment
│   ├── deploy-application.sh
│   ├── configure-nginx.sh
│   └── cloudflare-dns-setup.sh
│
├── 05-backup-restore/             # Backup and restore operations
│   ├── backup-full-system.sh/.bat
│   ├── restore-from-backup.sh
│   └── setup-automated-backups.sh
│
├── 06-maintenance/               # Ongoing maintenance
│   ├── health-check.sh
│   ├── update-system.sh
│   └── performance-audit.sh
│
└── 99-utilities/                # Helper utilities
    ├── generate-ssl-cert.sh
    ├── test-connections.sh
    └── cleanup-old-files.sh
```

## 🔧 Configuration Details

### Environment Variables (Production)
```bash
NODE_ENV=production
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://willworkforlunch.com
DOMAIN_NAME=willworkforlunch.com

DATABASE_URL=postgresql://postgres:password@db:5432/personal_website
POSTGRES_PASSWORD=secure-password

REDIS_PASSWORD=secure-redis-password
SMTP_HOST=smtp.gmail.com
SMTP_USER=admin@willworkforlunch.com
ADMIN_EMAIL=admin@willworkforlunch.com
```

### Port Configuration
- **Development**: 3006 (Next.js), 5436 (PostgreSQL)
- **Production**: 80/443 (Nginx), 3000 (Next.js internal)

### Directory Structure (Production)
```
/home/deploy/
├── personal-website/          # Application files
├── backups/                   # System backups
├── ssl/                       # SSL certificates
├── logs/                      # Application logs
└── scripts/                   # Deployment scripts
```

## 🔐 Security Features

All scripts include:
- ✅ Input validation and error handling
- ✅ Secure credential handling
- ✅ Backup before destructive operations
- ✅ Comprehensive logging
- ✅ Rollback procedures
- ✅ SSH key authentication
- ✅ Firewall configuration
- ✅ SSL/TLS encryption
- ✅ Rate limiting
- ✅ Fail2ban protection

## 📊 Monitoring and Maintenance

### Daily Operations
```bash
# Check system health
scripts/06-maintenance/health-check.sh

# View application logs
docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml logs -f app

# Check container status
docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml ps
```

### Weekly Operations
```bash
# System updates
scripts/06-maintenance/update-system.sh

# Performance audit
scripts/06-maintenance/performance-audit.sh

# Manual backup
scripts/05-backup-restore/backup-full-system.sh
```

### Automated Tasks
- 🔄 **Daily backups** at 2 AM (configured automatically)
- 🔄 **Weekly database maintenance** on Sundays at 3 AM
- 🔄 **Log rotation** (daily, 30-day retention)
- 🔄 **Security updates** (automatic)

## 🚨 Troubleshooting

### Common Issues

#### "Cannot connect to production server"
```bash
# Check SSH key authentication
ssh -p 22 deploy@your-server-ip

# Verify SSH key is added to server
cat ~/.ssh/id_rsa.pub
```

#### "Database export failed"
```bash
# Check database connection
psql -h localhost -p 5436 -U postgres -d personal_website

# Verify Docker containers are running
docker-compose ps
```

#### "Application won't start"
```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart containers
docker-compose -f docker-compose.prod.yml restart
```

#### "SSL certificate issues"
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test certificate
openssl s_client -connect willworkforlunch.com:443
```

### Emergency Procedures

#### Application Rollback
```bash
# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Restore from backup
scripts/05-backup-restore/restore-from-backup.sh TIMESTAMP

# Or deploy previous version
git checkout previous-commit
scripts/04-deployment/deploy-application.sh
```

#### Database Recovery
```bash
# Find available backups
ls -la /home/deploy/backups/database/

# Restore specific backup
gunzip < /home/deploy/backups/database/database_backup_TIMESTAMP.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres personal_website
```

## 📞 Support and Logs

### Log Locations
- **Deployment logs**: `/var/log/deployment/`
- **Application logs**: `docker-compose logs app`
- **System logs**: `/var/log/syslog`
- **Nginx logs**: `/var/log/nginx/`
- **Backup logs**: `/home/deploy/backup.log`

### Getting Help
1. Check script logs for specific errors
2. Review the troubleshooting section above
3. Consult the main `DEPLOYMENT_PLAN.md`
4. Use the health check script for system status

### Script Features
- 📋 Comprehensive error handling
- 📋 Progress indicators
- 📋 Colored output for clarity
- 📋 Detailed logging
- 📋 Rollback capabilities
- 📋 Validation checks
- 📋 Cross-platform compatibility (Windows/Linux)

## 🎉 Success Verification

After deployment, verify:
- ✅ Website loads: https://willworkforlunch.com
- ✅ Admin panel accessible: https://willworkforlunch.com/admin
- ✅ SSL certificate valid (A+ rating on SSL Labs)
- ✅ All containers healthy: `docker-compose ps`
- ✅ Database connectivity working
- ✅ Email functionality operational
- ✅ Backup system configured
- ✅ Monitoring setup complete

## 📚 Additional Resources

- **Main Deployment Plan**: `DEPLOYMENT_PLAN.md`
- **Migration Script**: `migrate-to-production.sh`
- **Package Documentation**: `PACKAGES.md`
- **Project README**: `README.md`
- **Windows Setup**: Check project documentation for Windows-specific instructions

---

**Note**: This deployment system is designed for the Personal Website project targeting willworkforlunch.com on Digital Ocean with CloudFlare. Adapt configuration values as needed for different domains or hosting providers. 