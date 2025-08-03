# Pre-Deployment Checklist - Personal Website Production

## 📋 Overview
This checklist ensures all requirements are met before deploying to production on Digital Ocean with CloudFlare.

**Target Domain**: `willworkforlunch.com`  
**Target Environment**: Digital Ocean Droplet + CloudFlare  
**Current Status**: Development environment with security updates completed

---

## ✅ Phase 1: Current System Status Verification

### **1.1 Security & Dependencies Status**
- [ ] **Next.js Version**: Verify running 15.4.1 (CVE-2025-29927 resolved)
  ```bash
  # Check current version
  npm list next
  # Should show: next@15.4.1
  ```

- [ ] **Dependencies Status**: Confirm all vulnerabilities resolved
  ```bash
  # Run security audit
  npm audit
  # Should show: 0 vulnerabilities
  ```

- [ ] **Package Overrides**: Verify security overrides are active
  ```bash
  # Check package.json overrides section
  grep -A 5 "overrides" package.json
  # Should show: cookie@^0.7.0, quill@^2.0.0
  ```

- [ ] **Replaced Dependencies**: Confirm moment.js replaced with dayjs
  ```bash
  # Check for moment.js (should not exist)
  npm list moment
  # Check for dayjs (should exist)
  npm list dayjs
  ```

### **1.2 Backup System Status**
- [ ] **Backup Directory**: Verify `backups/` directory exists and is organized
  ```bash
  ls -la backups/
  # Should show: database/, content/, config/, stats/, logs/ subdirectories
  ```

- [ ] **Backup Scripts**: Confirm all backup scripts are present
  ```bash
  ls -la backups/*.bat
  # Should show: backup-immediate.bat, backup-automated.bat, backup-scheduler.bat, restore-backup.bat
  ```

- [ ] **Current Backup**: Verify latest backup exists (ID: 20250715_135719)
  ```bash
  cat backups/backup_summary.txt
  # Should show: Latest backup information
  ```

- [ ] **Test Backup System**: Run immediate backup to verify functionality
  ```bash
  cd backups
  backup-immediate.bat
  # Should complete successfully
  ```

### **1.3 Application Status**
- [ ] **Database Connection**: Verify local database is accessible
  ```bash
  # Test database connection
  docker-compose exec db psql -U postgres -d personal_website -c "SELECT COUNT(*) FROM users;"
  ```

- [ ] **Application Startup**: Confirm application runs locally
  ```bash
  # Start application
  npm run dev
  # Visit http://localhost:3000 - should load successfully
  ```

- [ ] **Admin Panel**: Verify admin functionality works
  ```bash
  # Visit http://localhost:3000/admin
  # Should be accessible and functional
  ```

---

## ✅ Phase 2: Digital Ocean Droplet Setup

### **2.1 Droplet Creation**
- [ ] **Account Setup**: Ensure Digital Ocean account is ready
  - [ ] Account verified and payment method added
  - [ ] SSH keys uploaded to Digital Ocean

- [ ] **Droplet Specifications**
  - [ ] **OS**: Ubuntu 22.04 LTS selected
  - [ ] **Size**: Minimum 2 vCPUs, 4GB RAM, 80GB SSD
  - [ ] **Recommended**: 4 vCPUs, 8GB RAM, 160GB SSD
  - [ ] **Region**: Selected closest to target audience
  - [ ] **Additional Features**: 
    - [ ] IPv6 enabled
    - [ ] Monitoring enabled
    - [ ] Backups enabled

- [ ] **Droplet Access**
  - [ ] SSH key authentication configured
  - [ ] Root access confirmed
  - [ ] Droplet IP address documented: `________________`

### **2.2 Initial Server Configuration**
- [ ] **System Updates**
  ```bash
  ssh root@YOUR_DROPLET_IP
  apt update && apt upgrade -y
  ```

- [ ] **User Creation**
  ```bash
  # Create deploy user
  adduser deploy
  usermod -aG sudo deploy
  usermod -aG docker deploy
  ```

- [ ] **SSH Configuration**
  ```bash
  # Setup SSH keys for deploy user
  mkdir -p /home/deploy/.ssh
  cp ~/.ssh/authorized_keys /home/deploy/.ssh/
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
  ```

### **2.3 Security Hardening**
- [ ] **Firewall Configuration**
  ```bash
  # Configure UFW
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow ssh
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw enable
  ```

- [ ] **SSH Security**
  ```bash
  # Edit SSH config
  sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  systemctl restart ssh
  ```

- [ ] **Fail2ban Installation**
  ```bash
  apt install fail2ban -y
  systemctl enable fail2ban
  systemctl start fail2ban
  ```

### **2.4 Docker Installation**
- [ ] **Docker Engine**
  ```bash
  # Install Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  systemctl enable docker
  systemctl start docker
  ```

- [ ] **Docker Compose**
  ```bash
  # Install Docker Compose v2
  apt install docker-compose-plugin -y
  ```

- [ ] **User Permissions**
  ```bash
  # Add deploy user to docker group
  usermod -aG docker deploy
  ```

### **2.5 Additional Tools**
- [ ] **Essential Tools**
  ```bash
  apt install -y htop curl wget unzip git nginx certbot python3-certbot-nginx
  ```

- [ ] **Node.js** (for debugging)
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  apt install -y nodejs
  ```

---

## ✅ Phase 3: CloudFlare Configuration

### **3.1 Domain Setup**
- [ ] **Domain Ownership**: Confirm ownership of `willworkforlunch.com`
- [ ] **CloudFlare Account**: Account created and verified
- [ ] **Domain Added**: `willworkforlunch.com` added to CloudFlare
- [ ] **Nameservers**: Domain nameservers pointed to CloudFlare
  - [ ] Nameserver 1: `________________`
  - [ ] Nameserver 2: `________________`

### **3.2 DNS Records Configuration**
- [ ] **A Record**: `@` → `YOUR_DROPLET_IP` (Proxied)
- [ ] **A Record**: `www` → `YOUR_DROPLET_IP` (Proxied)
- [ ] **CNAME Record**: `admin` → `willworkforlunch.com` (Proxied)
- [ ] **MX Record**: `@` → `mail.willworkforlunch.com` (DNS Only)
- [ ] **TXT Record**: `@` → `"v=spf1 include:_spf.google.com ~all"` (DNS Only)

### **3.3 SSL/TLS Configuration**
- [ ] **Encryption Mode**: Set to "Full (strict)"
- [ ] **Always Use HTTPS**: Enabled
- [ ] **Minimum TLS Version**: Set to 1.2
- [ ] **Automatic HTTPS Rewrites**: Enabled
- [ ] **Certificate Transparency Monitoring**: Enabled

### **3.4 Security Settings**
- [ ] **Security Level**: Set to Medium
- [ ] **Bot Fight Mode**: Enabled
- [ ] **Challenge Passage**: Set to 30 minutes
- [ ] **Browser Integrity Check**: Enabled

---

## ✅ Phase 4: Application Deployment Preparation

### **4.1 Environment Variables**
- [ ] **Create Production Environment File**
  ```bash
  # Create .env.production with the following variables:
  NODE_ENV=production
  NEXTAUTH_SECRET=________________ # Generate 32+ character secret
  NEXTAUTH_URL=https://willworkforlunch.com
  NEXT_PUBLIC_SITE_URL=https://willworkforlunch.com
  DOMAIN_NAME=willworkforlunch.com
  
  # Database Configuration
  DATABASE_URL=postgresql://postgres:________________@db:5432/personal_website
  POSTGRES_DB=personal_website
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=________________ # Secure password
  
  # Redis Configuration
  REDIS_URL=redis://redis:6379
  REDIS_PASSWORD=________________ # Secure password
  
  # Email Configuration
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=admin@willworkforlunch.com
  SMTP_PASS=________________ # App-specific password
  ADMIN_EMAIL=admin@willworkforlunch.com
  CONTACT_EMAIL=contact@willworkforlunch.com
  
  # Security
  CRON_SECRET=________________ # Secure secret
  ```

- [ ] **Environment File Security**
  ```bash
  chmod 600 .env.production
  ```

### **4.2 Code Deployment**
- [ ] **Repository Setup**: Code repository ready for deployment
  - [ ] Git repository URL: `________________`
  - [ ] Deployment branch: `________________`
  - [ ] Latest commit tested and verified

- [ ] **Application Directory**
  ```bash
  # On server as deploy user
  mkdir -p /home/deploy/personal-website
  cd /home/deploy/personal-website
  # Clone or upload code
  ```

### **4.3 Docker Configuration**
- [ ] **Docker Compose Files**: Verify production configurations
  - [ ] `docker-compose.prod.yml` ready
  - [ ] `docker-compose.override.yml` configured
  - [ ] All necessary volumes and networks defined

- [ ] **SSL Certificate Directories**
  ```bash
  mkdir -p /home/deploy/personal-website/ssl
  mkdir -p /home/deploy/personal-website/ssl-challenges
  sudo chown -R deploy:deploy /home/deploy/personal-website/ssl*
  ```

---

## ✅ Phase 5: Database Migration Preparation

### **5.1 Migration Data Preparation**
- [ ] **Current Database Backup**: Create comprehensive backup
  ```bash
  # Use existing backup system
  cd backups
  backup-immediate.bat
  # Note backup ID: ________________
  ```

- [ ] **Database Statistics**: Document current data
  ```bash
  # Check backup_summary.txt for current stats
  cat backups/backup_summary.txt
  # Users: _______, Posts: _______, Projects: _______, Pages: _______, Media: _______
  ```

- [ ] **Content Assets**: Verify all media files are backed up
  ```bash
  # Check content backup size
  ls -lh backups/content/
  # Content size: ________________
  ```

### **5.2 Migration Scripts**
- [ ] **Database Export**: Prepare production-ready database export
  ```bash
  # Create migration-ready database dump
  # (Exclude development-specific data like sessions)
  ```

- [ ] **Content Package**: Prepare organized content assets
  ```bash
  # Package all images, uploads, and media files
  # for production deployment
  ```

### **5.3 Transfer Preparation**
- [ ] **File Transfer Method**: Choose transfer method to production
  - [ ] SCP/SFTP
  - [ ] Git repository
  - [ ] Cloud storage (S3, etc.)

- [ ] **Transfer Scripts**: Prepare transfer commands
  ```bash
  # scp backup files to production server
  # scp production_migration_*.sql.gz deploy@YOUR_DROPLET_IP:/home/deploy/
  ```

---

## ✅ Phase 6: SSL Certificate & Nginx Configuration

### **6.1 Initial Nginx Setup**
- [ ] **Basic Configuration**: Create initial Nginx config for Let's Encrypt
  ```bash
  # Create /etc/nginx/sites-available/willworkforlunch.com
  # Enable HTTP for certificate validation
  ```

- [ ] **Enable Site**
  ```bash
  sudo ln -s /etc/nginx/sites-available/willworkforlunch.com /etc/nginx/sites-enabled/
  sudo rm /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx
  ```

### **6.2 SSL Certificate**
- [ ] **Let's Encrypt Certificate**
  ```bash
  sudo certbot --nginx -d willworkforlunch.com -d www.willworkforlunch.com
  ```

- [ ] **Certificate Verification**
  ```bash
  sudo certbot certificates
  # Should show valid certificates
  ```

- [ ] **Auto-renewal Test**
  ```bash
  sudo certbot renew --dry-run
  # Should complete successfully
  ```

### **6.3 Production Nginx Configuration**
- [ ] **Security Headers**: Configure security headers
- [ ] **Rate Limiting**: Set up API rate limiting
- [ ] **Gzip Compression**: Enable compression
- [ ] **Static File Caching**: Configure caching rules
- [ ] **Proxy Configuration**: Set up reverse proxy to application

---

## ✅ Phase 7: Testing & Validation

### **7.1 Pre-deployment Testing**
- [ ] **Local Testing**: Final local application test
  ```bash
  # Test all major functionality locally
  npm run dev
  # Verify: Home page, Admin panel, API endpoints, Authentication
  ```

- [ ] **Environment Variables**: Verify all production variables are set
  ```bash
  # Check .env.production file completeness
  grep -c "=" .env.production
  # Should have all required variables
  ```

- [ ] **Docker Build**: Test Docker build process
  ```bash
  docker-compose -f docker-compose.prod.yml build
  # Should complete without errors
  ```

### **7.2 Post-deployment Testing Checklist**
- [ ] **Application Accessibility**
  - [ ] `https://willworkforlunch.com` loads correctly
  - [ ] `https://www.willworkforlunch.com` redirects properly
  - [ ] `https://willworkforlunch.com/admin` is accessible

- [ ] **SSL Certificate**
  - [ ] SSL Labs test: A+ rating
  - [ ] Certificate validity: Valid and trusted
  - [ ] HTTPS redirect: Working correctly

- [ ] **Database Connectivity**
  - [ ] Database connection successful
  - [ ] All migrated data present
  - [ ] Admin authentication working

- [ ] **API Endpoints**
  - [ ] `/api/health` returns 200
  - [ ] `/api/posts` returns data
  - [ ] `/api/projects` returns data
  - [ ] Authentication API working

- [ ] **Performance Testing**
  - [ ] Page load times acceptable
  - [ ] Database queries performing well
  - [ ] Image loading optimized

---

## ✅ Phase 8: Backup & Monitoring Setup

### **8.1 Production Backup System**
- [ ] **Backup Scripts**: Create Linux equivalents of Windows backup scripts
  ```bash
  # Create /home/deploy/backup-complete.sh
  # Set up automated backups
  ```

- [ ] **Backup Schedule**: Configure automated backups
  ```bash
  # Add to crontab: Daily backups at 2 AM
  (crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup-complete.sh >> /home/deploy/backup.log 2>&1") | crontab -
  ```

- [ ] **Backup Verification**: Test backup and restore process
  ```bash
  # Run manual backup
  /home/deploy/backup-complete.sh
  # Test restore process
  ```

### **8.2 Monitoring Setup**
- [ ] **Health Checks**: Set up automated health monitoring
  ```bash
  # Create /home/deploy/db-health-check.sh
  # Schedule daily health checks
  ```

- [ ] **Log Rotation**: Configure log rotation
  ```bash
  # Set up logrotate for application logs
  sudo nano /etc/logrotate.d/personal-website
  ```

- [ ] **Database Maintenance**: Schedule regular maintenance
  ```bash
  # Weekly database maintenance (Sundays at 3 AM)
  (crontab -l 2>/dev/null; echo "0 3 * * 0 /home/deploy/maintenance.sh >> /home/deploy/maintenance.log 2>&1") | crontab -
  ```

---

## ✅ Phase 9: Final Verification

### **9.1 Complete System Test**
- [ ] **Full Website Functionality**
  - [ ] All pages load correctly
  - [ ] Navigation works properly
  - [ ] Forms submit successfully
  - [ ] Images display correctly
  - [ ] Admin panel fully functional

- [ ] **Performance Metrics**
  - [ ] Page load times < 3 seconds
  - [ ] Database queries < 100ms average
  - [ ] Memory usage within acceptable limits
  - [ ] CPU usage stable

- [ ] **Security Verification**
  - [ ] All HTTPS redirects working
  - [ ] Security headers present
  - [ ] Rate limiting functional
  - [ ] Admin authentication secure

### **9.2 Documentation & Handoff**
- [ ] **Update Documentation**: Update all relevant documentation
  - [ ] DEPLOYMENT_PLAN.md
  - [ ] README.md
  - [ ] Any operational runbooks

- [ ] **Backup Documentation**: Document backup and restore procedures
- [ ] **Monitoring Documentation**: Document monitoring and maintenance procedures
- [ ] **Emergency Procedures**: Document emergency response procedures

---

## 📊 Deployment Summary

### **Current Status Overview**
- **Security**: ✅ All vulnerabilities resolved (0 vulnerabilities)
- **Backup System**: ✅ Comprehensive Windows-based system implemented
- **Dependencies**: ✅ All updated (Next.js 15.4.1, dayjs, updated axios/react-quill)
- **Organization**: ✅ Project structure cleaned and organized

### **Production Readiness**
- **Code Base**: ✅ Ready for production deployment
- **Database**: ✅ Current backup available (ID: 20250715_135719)
- **Content**: ✅ All media files backed up (8.7 MB)
- **Configuration**: ✅ All config files organized (678 KB)

### **Next Steps**
1. Complete server setup (Phase 2)
2. Configure CloudFlare (Phase 3)
3. Deploy application (Phase 4)
4. Migrate database and content (Phase 5)
5. Set up SSL and monitoring (Phases 6-8)
6. Final testing and verification (Phase 9)

---

## 🚨 Important Notes

- **Backup Before Deployment**: Always create a fresh backup before starting deployment
- **Test Restore Process**: Verify restore functionality before going live
- **Monitor During Deployment**: Watch for any issues during the deployment process
- **Have Rollback Plan**: Be prepared to rollback if issues arise
- **Document Everything**: Keep detailed logs of all deployment steps

**Emergency Contact**: Keep all server access information, passwords, and emergency procedures readily available.

---

*This checklist should be reviewed and updated as needed based on specific requirements and any changes to the deployment environment.* 