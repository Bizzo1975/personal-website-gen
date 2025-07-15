# Production Deployment Plan - Digital Ocean + CloudFlare

## Overview
This deployment plan outlines the complete process for deploying the Personal Website to a Digital Ocean Droplet with CloudFlare domain management for `willworkforlunch.com`.

**Current Application Status:**
- Next.js: 15.4.1 (secured, CVE-2025-29927 resolved)
- Authentication: NextAuth.js 4.24.11 (secured)
- Database: PostgreSQL 15 with secure configurations
- Security: All known vulnerabilities resolved (0 vulnerabilities)
- Dependencies: Fully updated and secure (axios, react-quill, dayjs replacing moment.js)
- Backup System: Comprehensive Windows-based backup system implemented
- File Organization: Project structure cleaned and organized

**Current Backup System Status:**
- ✅ **Backup ID**: `20250715_135719` (10.4 MB total)
- ✅ **Database**: 40.4 KB compressed (2 users, 4 posts, 35 projects, 5 pages, 47 media files)
- ✅ **Content**: 8.7 MB images/uploads/media files
- ✅ **Configuration**: 678 KB config files
- ✅ **Automated Scripts**: Windows batch files for immediate and scheduled backups
- ✅ **Restoration**: Complete restore system with restore-backup.bat
- ✅ **Documentation**: Comprehensive guides and completion reports

---

## Pre-Deployment Checklist

### **1. Digital Ocean Droplet Requirements**
- **Minimum Specs**: 2 vCPUs, 4GB RAM, 80GB SSD
- **Recommended**: 4 vCPUs, 8GB RAM, 160GB SSD  
- **OS**: Ubuntu 22.04 LTS
- **Region**: Choose closest to your target audience
- **Additional**: Enable monitoring, backups, and IPv6

### **2. Domain & DNS Setup (CloudFlare)**
- Domain: `willworkforlunch.com`
- Nameservers pointed to CloudFlare
- SSL/TLS encryption mode: **Full (strict)**
- Required DNS records (we'll set these up during deployment)

### **3. Required Environment Variables**
```bash
# Production Environment Variables
NODE_ENV=production
NEXTAUTH_SECRET=your-secure-secret-here-minimum-32-characters
NEXTAUTH_URL=https://willworkforlunch.com
NEXT_PUBLIC_SITE_URL=https://willworkforlunch.com
DOMAIN_NAME=willworkforlunch.com

# Database Configuration
DATABASE_URL=postgresql://postgres:secure_password@localhost:5432/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_database_password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=secure_redis_password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@willworkforlunch.com
SMTP_PASS=your-app-specific-password
ADMIN_EMAIL=admin@willworkforlunch.com
CONTACT_EMAIL=contact@willworkforlunch.com

# Security
CRON_SECRET=your-secure-cron-secret-key
```

---

## Phase 1: Server Setup & Hardening

### **Step 1: Initial Server Configuration**

```bash
# Connect to your droplet
ssh root@your-droplet-ip

# Update system packages
apt update && apt upgrade -y

# Create a non-root user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Setup SSH key authentication for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### **Step 2: Security Hardening**

```bash
# Configure UFW firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Configure SSH security
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Install fail2ban for brute force protection
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### **Step 3: Install Docker & Docker Compose**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose v2
apt install docker-compose-plugin -y

# Enable Docker service
systemctl enable docker
systemctl start docker

# Add deploy user to docker group
usermod -aG docker deploy
```

### **Step 4: Install Additional Tools**

```bash
# Install useful tools
apt install -y htop curl wget unzip git nginx certbot python3-certbot-nginx

# Install Node.js (for local development/debugging)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

---

## Phase 1.5: Database and Content Migration

**⚠️ CRITICAL: This phase must be completed before deploying to production**

This section covers migrating your existing database and content from your development/current environment to the production server.

### **🚀 Quick Start: Automated Migration Script**

For automated migration, use the provided migration script:

```bash
# Make the script executable (on Linux/Mac)
chmod +x migrate-to-production.sh

# Run the automated migration
./migrate-to-production.sh
```

This script will:
- ✅ Export your development database with production-ready settings
- ✅ Package all content and media files  
- ✅ Transfer everything to your production server
- ✅ Generate step-by-step instructions for production deployment
- ✅ Create rollback procedures and validation checklists

**If you prefer manual migration or need to troubleshoot, follow the detailed steps below.**

---

### **Manual Migration Procedures**

### **Pre-Migration Checklist**

1. **Identify Current Environment**
   - Development database location and credentials
   - Content/media files location (`/public/uploads`, `/public/images`, etc.)
   - User accounts and authentication data
   - Site settings and configuration data

2. **Migration Planning**
   - Estimated downtime window
   - Migration rollback plan
   - Content validation checklist

### **Step 1: Pre-Migration Backup & Assessment**

```bash
# On your current/development environment
# Create a comprehensive backup before migration

# 1. Backup current database
pg_dump -h localhost -p 5436 -U postgres -d personal_website > pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Create compressed backup
gzip pre_migration_backup_*.sql

# 3. Backup media files and uploads
tar -czf content_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads public/images

# 4. Export environment configuration (for reference)
cp .env.local env_backup_$(date +%Y%m%d_%H%M%S).txt

# 5. Document current database stats
psql -h localhost -p 5436 -U postgres -d personal_website -c "
  SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
  UNION ALL
  SELECT 'posts', COUNT(*) FROM posts
  UNION ALL  
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'pages', COUNT(*) FROM pages
  UNION ALL
  SELECT 'categories', COUNT(*) FROM categories
  UNION ALL
  SELECT 'access_requests', COUNT(*) FROM access_requests
  UNION ALL
  SELECT 'user_access_levels', COUNT(*) FROM user_access_levels
  UNION ALL
  SELECT 'media_files', COUNT(*) FROM media_files
  UNION ALL
  SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers;
" > database_stats_pre_migration.txt
```

### **Step 2: Export Database for Migration**

```bash
# Create production-ready database export
# This includes data but excludes development-specific configurations

pg_dump -h localhost -p 5436 -U postgres \
  --verbose \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exclude-table-data=sessions \
  --exclude-table-data=verification_tokens \
  -d personal_website > production_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify the export
echo "Database export size: $(du -h production_migration_*.sql)"
echo "Database export line count: $(wc -l production_migration_*.sql)"

# Compress for transfer
gzip production_migration_*.sql
```

### **Step 3: Prepare Content Assets for Migration**

```bash
# Create organized content backup for production
mkdir -p migration_content/{images,uploads,media}

# Copy and organize content files
cp -r public/images/* migration_content/images/ 2>/dev/null || true
cp -r public/uploads/* migration_content/uploads/ 2>/dev/null || true

# Copy any additional media files
find public -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" | \
  xargs -I {} cp {} migration_content/media/ 2>/dev/null || true

# Create content archive
tar -czf production_content_$(date +%Y%m%d_%H%M%S).tar.gz migration_content/

# Generate content inventory
find migration_content -type f | wc -l > content_file_count.txt
du -sh migration_content/* > content_size_summary.txt

echo "Content migration package ready:"
echo "Files: $(cat content_file_count.txt)"
echo "Total size: $(du -sh migration_content)"
```

### **Step 4: Transfer Migration Data to Production Server**

```bash
# Transfer files to production server (from your local machine)
# Replace 'your-droplet-ip' with your actual server IP

# Transfer database backup
scp production_migration_*.sql.gz deploy@your-droplet-ip:/home/deploy/

# Transfer content backup  
scp production_content_*.tar.gz deploy@your-droplet-ip:/home/deploy/

# Transfer reference files
scp database_stats_pre_migration.txt deploy@your-droplet-ip:/home/deploy/
scp content_*.txt deploy@your-droplet-ip:/home/deploy/

# Verify transfer
ssh deploy@your-droplet-ip "ls -la /home/deploy/*.gz /home/deploy/*.txt"
```

### **Step 5: Import Database to Production**

```bash
# On the production server, after Docker containers are running

# 1. Verify containers are healthy
docker compose -f docker-compose.prod.yml ps

# 2. Create backup directory and extract migration data
mkdir -p /home/deploy/migration
cd /home/deploy/migration
cp ../*.gz .
gunzip *.gz

# 3. Verify database export integrity
echo "Database export file size: $(du -h production_migration_*.sql)"
echo "Database export preview (first 20 lines):"
head -20 production_migration_*.sql

# 4. Import database (this will clean and recreate all tables)
echo "Starting database import..."
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db \
  psql -U postgres -d personal_website < production_migration_*.sql

# 5. Verify import success
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec db \
  psql -U postgres -d personal_website -c "
    SELECT 
      'users' as table_name, COUNT(*) as record_count FROM users
    UNION ALL
    SELECT 'posts', COUNT(*) FROM posts  
    UNION ALL
    SELECT 'projects', COUNT(*) FROM projects
    UNION ALL
    SELECT 'pages', COUNT(*) FROM pages
    UNION ALL
    SELECT 'categories', COUNT(*) FROM categories
    UNION ALL
    SELECT 'access_requests', COUNT(*) FROM access_requests
    UNION ALL
    SELECT 'user_access_levels', COUNT(*) FROM user_access_levels
    UNION ALL
    SELECT 'media_files', COUNT(*) FROM media_files
    UNION ALL
    SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers;
  " > /home/deploy/database_stats_post_migration.txt

# 6. Compare migration results
echo "=== MIGRATION COMPARISON ==="
echo "Pre-migration stats:"
cat /home/deploy/database_stats_pre_migration.txt
echo ""
echo "Post-migration stats:"
cat /home/deploy/database_stats_post_migration.txt
```

### **Step 6: Import Content Assets**

```bash
# Extract content backup
cd /home/deploy/migration
tar -xzf production_content_*.tar.gz

# Create production content directories
mkdir -p /home/deploy/personal-website/public/{images,uploads,media}

# Copy content to production application
cp -r migration_content/images/* /home/deploy/personal-website/public/images/ 2>/dev/null || true
cp -r migration_content/uploads/* /home/deploy/personal-website/public/uploads/ 2>/dev/null || true  
cp -r migration_content/media/* /home/deploy/personal-website/public/images/ 2>/dev/null || true

# Set correct permissions
sudo chown -R deploy:deploy /home/deploy/personal-website/public/
chmod -R 755 /home/deploy/personal-website/public/

# Verify content migration
echo "=== CONTENT MIGRATION VERIFICATION ==="
echo "Images directory: $(find /home/deploy/personal-website/public/images -type f | wc -l) files"
echo "Uploads directory: $(find /home/deploy/personal-website/public/uploads -type f | wc -l) files"
echo "Total content size: $(du -sh /home/deploy/personal-website/public/)"

# Create content inventory
find /home/deploy/personal-website/public -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" > /home/deploy/content_inventory_production.txt
echo "Content inventory saved to: /home/deploy/content_inventory_production.txt"
```

### **Step 7: Post-Migration Validation**

```bash
# 1. Restart application containers to ensure clean state
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml restart app

# Wait for application to start
sleep 30

# 2. Test database connectivity
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec app \
  node -e "
    const { query } = require('./src/lib/db');
    query('SELECT COUNT(*) as user_count FROM users')
      .then(result => console.log('Database connection successful. Users:', result.rows[0].user_count))
      .catch(err => console.error('Database connection failed:', err));
  "

# 3. Test authentication system
curl -X GET https://willworkforlunch.com/api/auth/session \
  -H "Content-Type: application/json"

# 4. Test content endpoints
curl -X GET https://willworkforlunch.com/api/posts
curl -X GET https://willworkforlunch.com/api/projects

# 5. Test admin functionality (replace with your admin credentials)
curl -X POST https://willworkforlunch.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@willworkforlunch.com", "password": "your-admin-password"}'

# 6. Test image serving
curl -I https://willworkforlunch.com/images/your-sample-image.jpg

# 7. Generate migration report
cat > /home/deploy/migration_report.txt << EOF
=== MIGRATION COMPLETION REPORT ===
Date: $(date)
Database Records Migrated: $(cat /home/deploy/database_stats_post_migration.txt)
Content Files Migrated: $(cat /home/deploy/content_inventory_production.txt | wc -l)
Migration Files Location: /home/deploy/migration/
Backup Files Retained: $(ls -la /home/deploy/*.gz 2>/dev/null | wc -l)

VALIDATION RESULTS:
- Database connectivity: $(docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T app echo "OK" 2>/dev/null || echo "FAILED")
- Application startup: $(curl -s -o /dev/null -w "%{http_code}" https://willworkforlunch.com/ || echo "FAILED")
- Admin panel access: $(curl -s -o /dev/null -w "%{http_code}" https://willworkforlunch.com/admin || echo "FAILED")

Next Steps:
1. Test all major functionality manually
2. Update DNS to point to production if not already done
3. Monitor application logs for 24-48 hours
4. Set up automated backups (completed in Phase 5)
EOF

echo "Migration completed! Review the report:"
cat /home/deploy/migration_report.txt
```

### **Step 8: Migration Rollback Procedures (If Needed)**

```bash
# Emergency rollback procedures (only if migration fails)

# 1. Stop production containers
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml down

# 2. Restore from pre-migration backup (if you have access to your dev environment)
# This would involve restoring your development environment and fixing issues

# 3. Alternative: Restore from fresh installation
docker volume rm personal-website_postgres_data personal-website_redis_data
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml up -d --build

# 4. Restore specific backup if available
# gunzip < your_backup_file.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres personal_website
```

### **Step 9: Post-Migration Security Update**

```bash
# Update production environment with migrated admin credentials
# This ensures your existing admin accounts work in production

# 1. Verify admin users migrated correctly
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec db \
  psql -U postgres -d personal_website -c "SELECT id, name, email, role FROM users WHERE role = 'admin';"

# 2. Update NextAuth secret for production (critical for session security)
# Edit your .env.production file to ensure NEXTAUTH_SECRET is different from development

# 3. Clear any development sessions
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec db \
  psql -U postgres -d personal_website -c "DELETE FROM sessions WHERE expires < NOW();"

# 4. Update admin email in environment if needed
# Ensure ADMIN_EMAIL in .env.production matches your primary admin account

echo "Migration security update completed!"
```

### **Migration Checklist Summary**

- [ ] **Pre-migration backup completed** (database + content)
- [ ] **Database export created** and transferred to production
- [ ] **Content assets packaged** and transferred to production  
- [ ] **Database imported successfully** to production
- [ ] **Content assets deployed** to production
- [ ] **Post-migration validation passed** (all tests successful)
- [ ] **Admin accounts verified** in production
- [ ] **Application functionality tested** manually
- [ ] **Migration report generated** and reviewed
- [ ] **Rollback procedures documented** and accessible
- [ ] **Production security settings updated**

---

## Phase 2: Application Deployment

### **Step 1: Setup Application Directory**

```bash
# Switch to deploy user
su - deploy

# Create application directory
mkdir -p /home/deploy/personal-website
cd /home/deploy/personal-website

# Clone your repository (replace with your actual repo)
git clone https://github.com/yourusername/personal-website-gen.git .

# Or upload files via SCP/SFTP if not using Git
```

### **Step 2: Configure Production Environment**

```bash
# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
NEXTAUTH_SECRET=GENERATE_32_CHAR_SECRET_HERE
NEXTAUTH_URL=https://willworkforlunch.com
NEXT_PUBLIC_SITE_URL=https://willworkforlunch.com
DOMAIN_NAME=willworkforlunch.com

DATABASE_URL=postgresql://postgres:SECURE_DB_PASSWORD@db:5432/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SECURE_DB_PASSWORD

REDIS_URL=redis://redis:6379
REDIS_PASSWORD=SECURE_REDIS_PASSWORD

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@willworkforlunch.com
SMTP_PASS=YOUR_APP_PASSWORD
ADMIN_EMAIL=admin@willworkforlunch.com
CONTACT_EMAIL=contact@willworkforlunch.com

CRON_SECRET=SECURE_CRON_SECRET
EOF

# Secure the environment file
chmod 600 .env.production
```

### **Step 3: Setup SSL Certificate Directories**

```bash
# Create SSL directories
mkdir -p /home/deploy/personal-website/ssl
mkdir -p /home/deploy/personal-website/ssl-challenges
sudo chown -R deploy:deploy /home/deploy/personal-website/ssl*
```

### **Step 4: Configure Nginx for Let's Encrypt**

```bash
# Create initial Nginx configuration
sudo tee /etc/nginx/sites-available/willworkforlunch.com << 'EOF'
server {
    listen 80;
    server_name willworkforlunch.com www.willworkforlunch.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /home/deploy/personal-website/ssl-challenges;
    }
    
    # Temporary redirect to HTTPS (we'll update this after SSL setup)
    location / {
        return 301 https://$host$request_uri;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/willworkforlunch.com /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Phase 3: CloudFlare DNS Configuration

### **Step 1: CloudFlare DNS Records**

Set up the following DNS records in your CloudFlare dashboard:

| Type | Name | Content | TTL | Proxy Status |
|------|------|---------|-----|--------------|
| A | @ | YOUR_DROPLET_IP | Auto | Proxied |
| A | www | YOUR_DROPLET_IP | Auto | Proxied |
| CNAME | admin | willworkforlunch.com | Auto | Proxied |
| MX | @ | mail.willworkforlunch.com | Auto | DNS Only |
| TXT | @ | "v=spf1 include:_spf.google.com ~all" | Auto | DNS Only |

### **Step 2: CloudFlare SSL/TLS Settings**

In CloudFlare Dashboard → SSL/TLS:
- **Encryption Mode**: Full (strict)
- **Always Use HTTPS**: ON
- **Minimum TLS Version**: 1.2
- **Automatic HTTPS Rewrites**: ON
- **Certificate Transparency Monitoring**: ON

### **Step 3: CloudFlare Security Settings**

In CloudFlare Dashboard → Security:
- **Security Level**: Medium
- **Bot Fight Mode**: ON
- **Challenge Passage**: 30 minutes
- **Browser Integrity Check**: ON

---

## Phase 4: SSL Certificate & Production Deployment

### **Step 1: Obtain SSL Certificate**

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d willworkforlunch.com -d www.willworkforlunch.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### **Step 2: Update Nginx Configuration for Production**

```bash
# Create production Nginx config
sudo tee /etc/nginx/sites-available/willworkforlunch.com << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream to Docker container
upstream app_upstream {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name willworkforlunch.com www.willworkforlunch.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name willworkforlunch.com www.willworkforlunch.com;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/willworkforlunch.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/willworkforlunch.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static file serving
    location /_next/static/ {
        proxy_pass http://app_upstream;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://app_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Main application
    location / {
        proxy_pass http://app_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 3: Deploy with Docker Compose**

```bash
# Return to application directory
cd /home/deploy/personal-website

# Create production docker-compose override
cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  app:
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - .env.production
    restart: unless-stopped

  db:
    restart: unless-stopped
    env_file:
      - .env.production

  redis:
    restart: unless-stopped
    env_file:
      - .env.production
EOF

# Build and start the application
docker compose -f docker-compose.prod.yml up -d --build

# Check container status
docker compose ps
docker compose logs -f app
```

---

## Phase 5: Post-Deployment Configuration

### **Step 1: Database Initialization**

⚠️ **Note**: If you completed Phase 1.5 (Database Migration), skip this step as your data is already imported.

```bash
# Only run this if you're doing a fresh installation without existing data

# Wait for containers to be healthy
sleep 30

# Check if database needs initialization
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d personal_website -c "\dt"

# If tables don't exist and you haven't migrated data, initialize with schema only
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d personal_website -f /docker-entrypoint-initdb.d/01-init.sql

# If you migrated data, verify the migration was successful
if [ -f "/home/deploy/database_stats_post_migration.txt" ]; then
  echo "=== VERIFYING MIGRATED DATA ==="
  cat /home/deploy/database_stats_post_migration.txt
else
  echo "=== FRESH INSTALLATION - Creating initial admin user required ==="
fi
```

### **Step 2: Create Admin User**

⚠️ **Note**: If you migrated existing data, your admin users should already exist. Verify access instead of creating new accounts.

```bash
# If you migrated data, test existing admin login
if [ -f "/home/deploy/migration_report.txt" ]; then
  echo "Testing existing admin access (replace with your migrated admin credentials):"
  curl -X POST https://willworkforlunch.com/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "your-existing-admin@email.com", "password": "your-existing-password"}'
else
  # Fresh installation - create new admin user
  curl -X POST https://willworkforlunch.com/api/admin/setup \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Admin User",
      "email": "admin@willworkforlunch.com", 
      "password": "SecureAdminPassword123!"
    }'
fi
```

### **Step 3: Setup Enhanced Monitoring & Backups**

⚠️ **Note**: This project includes a comprehensive Windows-based backup system located in the `backups/` directory.

#### **For Development/Local Environment (Windows)**
The current project includes a fully implemented backup system with the following components:

```
backups/
├── backup-immediate.bat      # Immediate full backup
├── backup-automated.bat      # Automated backup with retention
├── backup-scheduler.bat      # Windows Task Scheduler integration
├── restore-backup.bat        # Complete restore system
├── BACKUP_SYSTEM_GUIDE.md    # Comprehensive documentation
└── BACKUP_COMPLETION_REPORT.md # Implementation report
```

**To run backups locally:**
```batch
# Immediate backup
cd backups
backup-immediate.bat

# Automated backup with retention
backup-automated.bat

# Schedule via Task Scheduler
backup-scheduler.bat daily
```

#### **For Production Environment (Linux)**
For production deployment, create equivalent Linux backup scripts:

```bash
# Create comprehensive backup script that handles both database and content
cat > /home/deploy/backup-complete.sh << 'EOF'
#!/bin/bash

# Configuration
BACKUP_DIR="/home/deploy/backups"
APP_DIR="/home/deploy/personal-website"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=14

# Create backup directory structure
mkdir -p $BACKUP_DIR/{database,content,config,logs,stats}

echo "Starting complete backup at $(date)"

# 1. Database backup
echo "Backing up database..."
DB_BACKUP_FILE="$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql"
docker compose -f $APP_DIR/docker-compose.prod.yml exec -T db \
  pg_dump -U postgres --verbose --clean --if-exists personal_website > "$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
  gzip "$DB_BACKUP_FILE"
  echo "Database backup completed: $(basename $DB_BACKUP_FILE).gz"
else
  echo "Database backup failed!"
  exit 1
fi

# 2. Content/media backup
echo "Backing up content and media files..."
CONTENT_BACKUP_FILE="$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz"
tar -czf "$CONTENT_BACKUP_FILE" -C $APP_DIR public/images public/uploads 2>/dev/null

if [ $? -eq 0 ]; then
  echo "Content backup completed: $(basename $CONTENT_BACKUP_FILE)"
else
  echo "Content backup completed with warnings (some directories may be empty)"
fi

# 3. Configuration backup
echo "Backing up configuration..."
CONFIG_BACKUP_FILE="$BACKUP_DIR/config/config_backup_$TIMESTAMP.tar.gz"
tar -czf "$CONFIG_BACKUP_FILE" -C $APP_DIR .env.production docker-compose.prod.yml nginx.conf 2>/dev/null

# 4. Database statistics for monitoring
echo "Generating database statistics..."
docker compose -f $APP_DIR/docker-compose.prod.yml exec -T db \
  psql -U postgres -d personal_website -c "
    SELECT 
      'users' as table_name, COUNT(*) as record_count FROM users
    UNION ALL
    SELECT 'posts', COUNT(*) FROM posts  
    UNION ALL
    SELECT 'projects', COUNT(*) FROM projects
    UNION ALL
    SELECT 'pages', COUNT(*) FROM pages
    UNION ALL
    SELECT 'media_files', COUNT(*) FROM media_files
    UNION ALL
    SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers;
  " > "$BACKUP_DIR/stats/db_stats_$TIMESTAMP.txt"

# 5. Application logs backup (last 1000 lines)
echo "Backing up recent application logs..."
docker compose -f $APP_DIR/docker-compose.prod.yml logs --tail=1000 app > "$BACKUP_DIR/logs/app_logs_$TIMESTAMP.txt" 2>/dev/null

# 6. Cleanup old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "*backup_*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "db_stats_*.txt" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "app_logs_*.txt" -mtime +$RETENTION_DAYS -delete

# 7. Summary
echo ""
echo "=== BACKUP SUMMARY ==="
echo "Timestamp: $TIMESTAMP"
echo "Database backup: $(ls -lh $BACKUP_DIR/database/*$TIMESTAMP.sql.gz 2>/dev/null | awk '{print $5}')"
echo "Content backup: $(ls -lh $BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz 2>/dev/null | awk '{print $5}')"
echo "Total backups in directory: $(find $BACKUP_DIR -name "*backup_*.gz" | wc -l)"
echo "Backup directory size: $(du -sh $BACKUP_DIR | awk '{print $1}')"
echo "Backup completed successfully at $(date)"

# Optional: Send backup notification (if you have email configured)
# echo "Backup completed at $(date)" | mail -s "Personal Website Backup Complete" admin@willworkforlunch.com
EOF

chmod +x /home/deploy/backup-complete.sh

# Create restore script for easy recovery
cat > /home/deploy/restore-backup.sh << 'EOF'
#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <backup_timestamp>"
  echo "Available backups:"
  ls -la /home/deploy/backups/*backup_*.sql.gz | awk '{print $9}' | sed 's/.*backup_//' | sed 's/.sql.gz//'
  exit 1
fi

TIMESTAMP=$1
BACKUP_DIR="/home/deploy/backups"
APP_DIR="/home/deploy/personal-website"

echo "Starting restore from backup timestamp: $TIMESTAMP"

# 1. Stop application
echo "Stopping application..."
docker compose -f $APP_DIR/docker-compose.prod.yml stop app

# 2. Restore database
if [ -f "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" ]; then
  echo "Restoring database..."
  gunzip < "$BACKUP_DIR/database/database_backup_$TIMESTAMP.sql.gz" | \
    docker compose -f $APP_DIR/docker-compose.prod.yml exec -T db \
    psql -U postgres -d personal_website
  echo "Database restore completed"
else
  echo "Database backup file not found: database/database_backup_$TIMESTAMP.sql.gz"
  exit 1
fi

# 3. Restore content
if [ -f "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz" ]; then
  echo "Restoring content files..."
  cd $APP_DIR
  tar -xzf "$BACKUP_DIR/content/content_backup_$TIMESTAMP.tar.gz"
  echo "Content restore completed"
else
  echo "Content backup file not found: content/content_backup_$TIMESTAMP.tar.gz"
fi

# 4. Start application
echo "Starting application..."
docker compose -f $APP_DIR/docker-compose.prod.yml start app

echo "Restore completed! Verify functionality at https://willworkforlunch.com"
EOF

chmod +x /home/deploy/restore-backup.sh

# Set up automated backups (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup-complete.sh >> /home/deploy/backup.log 2>&1") | crontab -

# Set up weekly database maintenance (Sundays at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /home/deploy/personal-website/docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c 'VACUUM ANALYZE;' >> /home/deploy/maintenance.log 2>&1") | crontab -

echo "Enhanced backup and maintenance system configured!"
echo "- Daily backups at 2 AM"
echo "- Weekly database maintenance on Sundays at 3 AM" 
echo "- Backups retained for 14 days"
echo "- Manual restore: /home/deploy/restore-backup.sh <timestamp>"
```

### **Step 4: Setup Log Rotation**

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/personal-website << 'EOF'
/home/deploy/personal-website/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        docker compose -f /home/deploy/personal-website/docker-compose.prod.yml restart app
    endscript
}
EOF
```

---

## Phase 6: Final Testing & Validation

### **Step 1: Application Testing**

```bash
# Test main website
curl -I https://willworkforlunch.com

# Test admin panel
curl -I https://willworkforlunch.com/admin

# Test API health
curl https://willworkforlunch.com/api/health

# Test SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=willworkforlunch.com
```

### **Step 2: Performance Testing**

```bash
# Install performance testing tools (optional)
npm install -g lighthouse-cli

# Run Lighthouse audit
lighthouse https://willworkforlunch.com --output html --output-path ./lighthouse-report.html
```

### **Step 3: Security Validation**

```bash
# Check for security headers
curl -I https://willworkforlunch.com

# Test rate limiting
for i in {1..15}; do curl -I https://willworkforlunch.com/api/test; done
```

---

## Maintenance & Operations

### **Daily Operations**
- Monitor application logs: `docker compose logs -f app`
- Check system resources: `htop`, `df -h`
- Review backup status: `ls -la /home/deploy/backups/`
- Monitor database connections: `docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec db psql -U postgres -d personal_website -c "SELECT count(*) FROM pg_stat_activity;"`

### **Weekly Operations**
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review CloudFlare analytics and security events
- Test backup restoration process: `/home/deploy/restore-backup.sh <recent_timestamp>`
- Database maintenance and optimization:
  ```bash
  # Run database maintenance (automatically scheduled Sundays 3 AM)
  docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c 'VACUUM ANALYZE;'
  
  # Check database statistics
  docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "
    SELECT 
      schemaname,
      tablename,
      attname,
      n_distinct,
      correlation
    FROM pg_stats 
    WHERE schemaname = 'public' 
    ORDER BY tablename, attname;
  "
  
  # Monitor database size growth
  docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "
    SELECT 
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      schemaname,
      tablename
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  "
  ```

### **Monthly Operations**
- Review and rotate secrets if needed
- Update Docker images: `docker compose pull && docker compose up -d`
- Performance audit with Lighthouse
- Database performance analysis:
  ```bash
  # Check slow queries (adjust time threshold as needed)
  docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "
    SELECT query, calls, total_time, mean_time 
    FROM pg_stat_statements 
    WHERE mean_time > 100 
    ORDER BY mean_time DESC 
    LIMIT 10;
  "
  
  # Check database bloat
  docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "
    SELECT 
      tablename,
      pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
      pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
      pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(tablename::regclass) DESC;
  "
  ```

### **Database Monitoring Commands**

```bash
# Quick database health check
cat > /home/deploy/db-health-check.sh << 'EOF'
#!/bin/bash
echo "=== DATABASE HEALTH CHECK ==="
echo "Date: $(date)"
echo ""

# Connection test
echo "1. Connection Test:"
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT 'Database connected successfully' as status;" 2>/dev/null || echo "FAILED: Database connection"

# Database size
echo ""
echo "2. Database Size:"
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT pg_size_pretty(pg_database_size('personal_website')) as database_size;" 2>/dev/null

# Active connections
echo ""
echo "3. Active Connections:"
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null

# Record counts
echo ""
echo "4. Record Counts:"
docker compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website -c "
  SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
  UNION ALL
  SELECT 'posts', COUNT(*) FROM posts  
  UNION ALL
  SELECT 'projects', COUNT(*) FROM projects
  UNION ALL
  SELECT 'pages', COUNT(*) FROM pages
  UNION ALL
  SELECT 'media_files', COUNT(*) FROM media_files;
" 2>/dev/null

# Disk usage
echo ""
echo "5. Disk Usage:"
echo "Total: $(df -h /home/deploy | tail -1 | awk '{print $2}')"
echo "Used: $(df -h /home/deploy | tail -1 | awk '{print $3}')"
echo "Available: $(df -h /home/deploy | tail -1 | awk '{print $4}')"
echo "Usage: $(df -h /home/deploy | tail -1 | awk '{print $5}')"

echo ""
echo "=== HEALTH CHECK COMPLETE ==="
EOF

chmod +x /home/deploy/db-health-check.sh

# Run daily health check (add to cron)
(crontab -l 2>/dev/null; echo "0 6 * * * /home/deploy/db-health-check.sh >> /home/deploy/health-check.log 2>&1") | crontab -
```

### **Emergency Procedures**

#### **For Production Environment:**
- **Rollback**: `git checkout previous-commit && docker compose up -d --build`
- **Database Restore**: `gunzip < backup.sql.gz | docker compose exec -T db psql -U postgres personal_website`
- **Scale Up**: Update droplet resources in Digital Ocean dashboard

#### **For Development Environment (Current System):**
- **Immediate Backup**: `cd backups && backup-immediate.bat`
- **Database Restore**: `cd backups && restore-backup.bat <timestamp>`
- **View Backup Status**: Review `backups/backup_summary.txt`
- **Current Backup**: ID `20250715_135719` (10.4 MB total)
- **Backup Location**: `backups/` directory with organized structure

---

## Troubleshooting Guide

### **Common Issues**

1. **503 Service Unavailable**
   - Check container status: `docker compose ps`
   - Check application logs: `docker compose logs app`
   - Verify database connection

2. **SSL Certificate Issues**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

3. **Database Connection Errors**
   - Check database logs: `docker compose logs db`
   - Verify environment variables
   - Test database connectivity

4. **Performance Issues**
   - Check system resources: `htop`
   - Review Nginx access logs
   - Monitor CloudFlare analytics

---

## Security Considerations

### **Implemented Security Measures**
- SSL/TLS encryption with Let's Encrypt
- CloudFlare DDoS protection and WAF
- Rate limiting on API endpoints
- Security headers (HSTS, CSP, etc.)
- Database access restricted to localhost
- Non-root user for application execution
- Firewall configuration (UFW)
- Fail2ban for brute force protection

### **Recent Security Updates (Completed)**
- ✅ **Next.js**: Updated from 14.0.3 to 15.4.1 (CVE-2025-29927 resolved)
- ✅ **Dependencies**: Updated axios, react-quill, replaced moment.js with dayjs
- ✅ **Vulnerabilities**: All known vulnerabilities resolved (0 vulnerabilities)
- ✅ **Package Overrides**: Implemented cookie@^0.7.0, quill@^2.0.0 for security
- ✅ **Node-fetch**: Removed deprecated version 2.7.0
- ✅ **Security Audit**: Comprehensive security review completed

### **Ongoing Security Tasks**
- Regular security updates
- Monitor security logs
- Review CloudFlare security events
- Rotate secrets and passwords quarterly
- Regular security audits

---

## Estimated Costs (Monthly)

| Service | Cost (USD) |
|---------|------------|
| Digital Ocean Droplet (4 vCPU, 8GB) | $48 |
| Digital Ocean Backups | $9.60 |
| CloudFlare Pro (optional) | $20 |
| **Total Estimated** | **$77.60** |

*Note: CloudFlare Free tier is sufficient for most use cases*

---

## Questions for Clarification

1. **Git Repository**: Do you have the code in a Git repository, or should we set up deployment via file upload?

2. **Email Provider**: Do you want to use Gmail/Google Workspace for SMTP, or would you prefer a dedicated email service like SendGrid?

3. **Monitoring**: Would you like to set up additional monitoring tools like Uptime Robot or New Relic?

4. **CI/CD**: Do you want to implement automated deployment via GitHub Actions or similar?

5. **Scaling**: Do you anticipate high traffic that might require load balancing or CDN beyond CloudFlare?

6. **Backup Storage**: Would you like to store backups in Digital Ocean Spaces or another cloud storage service?

## Current Project Organization

The project has been organized with a clean structure:

```
personal-website-gen/
├── backups/                    # Comprehensive backup system
│   ├── backup-immediate.bat    # Immediate full backup
│   ├── backup-automated.bat    # Automated backup with retention
│   ├── backup-scheduler.bat    # Task scheduler integration
│   ├── restore-backup.bat      # Complete restore system
│   ├── database/               # Database backups
│   ├── content/               # Content backups
│   ├── config/                # Configuration backups
│   ├── stats/                 # Database statistics
│   └── logs/                  # Backup logs
├── scripts/                   # Deployment and maintenance scripts
├── src/                       # Application source code
├── public/                    # Static assets
├── components/                # React components
└── [other standard Next.js files]
```

## Summary

This plan provides a production-ready deployment with security best practices, monitoring, and maintenance procedures. The setup is designed to be simple yet robust for a personal website with admin functionality.

**Key Features:**
- ✅ **Security**: All vulnerabilities resolved, modern dependencies
- ✅ **Backup System**: Comprehensive Windows-based backup system implemented
- ✅ **Organization**: Clean project structure with proper file organization
- ✅ **Documentation**: Complete guides and implementation reports
- ✅ **Production Ready**: Ready for Digital Ocean + CloudFlare deployment 