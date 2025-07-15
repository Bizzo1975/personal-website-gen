# Scripts Overview - Personal Website Deployment

This document provides a complete overview of all deployment and maintenance scripts for the Personal Website project.

## 🎯 Purpose

These scripts provide a complete deployment pipeline for the Personal Website project, enabling:
- **Automated deployment** from development to production
- **Data migration** with integrity checks
- **System monitoring** and health checks
- **Automated backups** and restore procedures
- **Cross-platform support** (Windows/Linux/macOS)

## 📊 Script Categories

### 🚀 Main Orchestrators
| Script | Platform | Purpose |
|--------|----------|---------|
| `run-full-deployment.sh` | Linux/macOS | Complete deployment orchestrator |
| `run-full-deployment.bat` | Windows | Complete deployment orchestrator |

**Features:**
- Interactive configuration wizard
- Phase-by-phase deployment
- Error handling and rollback
- Comprehensive logging
- Multiple deployment modes (fresh, update, migration, reinstall)

---

### 📦 Data Migration (`02-migration/`)
| Script | Platform | Purpose |
|--------|----------|---------|
| `export-dev-data.sh` | Linux/macOS | Export development database and content |

**Features:**
- PostgreSQL database export with production optimization
- Content and media file packaging
- Integrity validation and checksums

---

### 🖥️ Server Setup (`03-server-setup/`)
| Script | Platform | Purpose |
|--------|----------|---------|
| `initial-server-setup.sh` | Linux | Configure fresh Digital Ocean droplet |
| `install-dependencies.sh` | Linux | Install Docker, Node.js, tools |

**Features:**
- Ubuntu 22.04 LTS optimization
- Security hardening (firewall, fail2ban, SSH)
- Docker and containerization setup
- User and permission management

---

### 🚀 Application Deployment (`04-deployment/`)
| Script | Platform | Purpose |
|--------|----------|---------|
| `deploy-application.sh` | Linux | Deploy app to production server |

**Features:**
- Docker Compose production deployment
- Environment configuration management
- Health checks and validation

---

### 💾 Backup & Restore (`05-backup-restore/`)
| Script | Platform | Purpose |
|--------|----------|---------|
| `backup-full-system.sh` | Linux | Complete system backup |
| `backup-full-system.bat` | Windows | Complete system backup |

**Features:**
- Database, content, and configuration backup
- Integrity verification
- Cross-platform support

---

### 🔍 Maintenance & Monitoring (`06-maintenance/`)
| Script | Platform | Purpose |
|--------|----------|---------|
| `health-check.sh` | Linux | Comprehensive system health check |

**Features:**
- System resource monitoring
- Container health verification
- Database connectivity tests
- Security status checks
- Performance metrics

## 🔄 Deployment Workflows

### Complete First-Time Deployment
```bash
# Linux/macOS
./scripts/run-full-deployment.sh

# Windows  
scripts\run-full-deployment.bat
```

### Data Migration Only
```bash
# Export from development
scripts/02-migration/export-dev-data.sh
```

### Application Update
```bash
# Production server
scripts/04-deployment/deploy-application.sh
```

### System Maintenance
```bash
# Health check
scripts/06-maintenance/health-check.sh

# Full backup (Linux)
scripts/05-backup-restore/backup-full-system.sh

# Full backup (Windows)
scripts\05-backup-restore\backup-full-system.bat
```

## 📋 Prerequisites by Category

### Development Environment
- ✅ Windows/Linux/macOS
- ✅ Docker Desktop
- ✅ Node.js 18+
- ✅ PostgreSQL client tools
- ✅ Git

### Production Server
- ✅ Digital Ocean Droplet (Ubuntu 22.04 LTS)
- ✅ SSH access with key authentication
- ✅ CloudFlare account
- ✅ Domain name (willworkforlunch.com)

## 🔐 Security Features

All scripts include:
- **Input validation** and sanitization
- **Error handling** with graceful failures
- **Logging** of all operations
- **Backup before destructive operations**
- **Secure credential handling**
- **Permission verification**
- **Rollback capabilities**

## 📊 Monitoring and Alerting

### Automated Monitoring
- **Daily health checks** (configurable)
- **Automated backups** (daily at 2 AM)
- **Log rotation** (30-day retention)
- **SSL certificate monitoring**
- **Resource usage alerts**

### Manual Monitoring
- System health dashboard
- Performance metrics collection
- Security status verification
- Backup integrity validation

## 🛡️ Disaster Recovery

### Backup Strategy
- **Daily automated backups**
- **14-day retention policy**
- **Multi-component backup** (DB + content + config)
- **Integrity verification**
- **Cross-platform restore capability**

### Recovery Procedures
1. **Application rollback** (code level)
2. **Database point-in-time restore** 
3. **Content restoration**
4. **Configuration recovery**
5. **Complete system rebuild**

## 📈 Performance Features

### Optimization
- **Container health monitoring**
- **Resource usage tracking**
- **SSL/TLS optimization**
- **Database performance monitoring**
- **Nginx performance tuning**

### Scalability
- **Horizontal scaling preparation**
- **Load balancer ready configuration**
- **CDN integration (CloudFlare)**
- **Database optimization**
- **Caching layer support**

## 🔧 Configuration Management

### Environment Variables
- **Development vs Production separation**
- **Secure secret management**
- **Environment-specific configurations**
- **Dynamic configuration updates**

### Infrastructure as Code
- **Docker Compose definitions**
- **Nginx configuration templates**
- **SSL certificate automation**
- **DNS configuration scripts**

## 📞 Support and Troubleshooting

### Log Locations
- **Deployment logs**: `/var/log/deployment/`
- **Application logs**: `docker-compose logs`
- **System logs**: `/var/log/syslog`
- **Backup logs**: `/home/deploy/backup.log`

### Troubleshooting Tools
- Interactive health check script
- Connection testing utilities
- Log analysis helpers
- Performance profiling tools

### Common Issues Resolution
1. **Database connection failures**
2. **SSL certificate problems**
3. **Container startup issues**
4. **Resource exhaustion**
5. **Network connectivity problems**

## 🎯 Success Metrics

After successful deployment:
- ✅ Website accessible: https://willworkforlunch.com
- ✅ Admin panel functional: https://willworkforlunch.com/admin
- ✅ SSL A+ rating on SSL Labs
- ✅ All containers healthy
- ✅ Database fully migrated
- ✅ Automated backups working
- ✅ Monitoring systems active
- ✅ Performance targets met

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md**: Step-by-step deployment instructions
- **README.md**: Script directory documentation  
- **DEPLOYMENT_PLAN.md**: Comprehensive deployment strategy
- **Individual script headers**: Detailed usage instructions

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Compatibility**: Windows 10/11, Ubuntu 22.04 LTS, macOS 12+  
**Target Environment**: Digital Ocean + CloudFlare  
**Domain**: willworkforlunch.com 