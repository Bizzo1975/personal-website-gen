# Production Deployment Guide - willworkforlunch.com

## 🎯 Overview
Complete deployment guide for Personal Website to Digital Ocean Droplet with CloudFlare and SendGrid.

**Current System Status:**
- ✅ **Application**: Next.js 15.4.1, TypeScript, PostgreSQL 15, Redis 7
- ✅ **Security**: All vulnerabilities resolved (0 vulnerabilities) 
- ✅ **Backup**: Latest backup ID `20250715_193636` (27 MB total)
- ✅ **Database**: 2 users, 4 posts, 35 projects, 5 pages, 47 media files
- ✅ **Media Files**: Organized in `/public/uploads/` with database metadata
- ✅ **Schema**: Complete with all tables (users, posts, projects, pages, categories, media_files, profiles, etc.)

---

## 🔑 Prerequisites Checklist

### **Required Information**
- [ ] **Digital Ocean**: Account ready with SSH keys uploaded
- [ ] **Domain**: `willworkforlunch.com` owned and accessible  
- [ ] **CloudFlare**: Account created, domain added
- [ ] **SendGrid**: API key ready for transactional emails
- [ ] **Secure Passwords**: Generated for database, Redis, NextAuth (32+ chars each)

### **Required Credentials Template**
```bash
# Fill these out before starting:
DROPLET_IP=________________
SSH_PRIVATE_KEY_PATH=________________
CLOUDFLARE_EMAIL=________________
SENDGRID_API_KEY=________________
NEXTAUTH_SECRET=________________ # 32+ characters
POSTGRES_PASSWORD=________________ # Secure password
REDIS_PASSWORD=________________ # Secure password
CRON_SECRET=________________ # Secure password
ADMIN_EMAIL=admin@willworkforlunch.com
```

---

## 🚀 Phase 1: Digital Ocean Droplet Setup

### **1.1 Create Droplet**
- **Specifications**: 4 vCPUs, 8GB RAM, 160GB SSD (recommended)
- **OS**: Ubuntu 22.04 LTS
- **Features**: Enable IPv6, Monitoring, and Backups
- **SSH Keys**: Add your SSH key during creation

### **1.2 Initial Server Configuration**
```bash
# Connect to server
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Create deploy user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user for remaining steps
su - deploy
```

### **1.3 Security Hardening**
```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Secure SSH (as root)
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **1.4 Install Dependencies**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose v2
sudo apt install docker-compose-plugin -y

# Install additional tools
sudo apt install -y htop curl wget unzip git nginx certbot python3-certbot-nginx nodejs npm
```

---

## 🌐 Phase 2: CloudFlare Configuration

### **2.1 Domain Setup**
1. **Add Domain**: Add `willworkforlunch.com` to CloudFlare
2. **Update Nameservers**: Point domain to CloudFlare nameservers
3. **Wait for Propagation**: Usually takes 2-24 hours

### **2.2 DNS Records**
Configure these DNS records in CloudFlare:
```
Type    Name    Content                 Proxy Status
A       @       YOUR_DROPLET_IP        Proxied
A       www     YOUR_DROPLET_IP        Proxied  
CNAME   admin   willworkforlunch.com   Proxied
```

### **2.3 SSL/TLS Settings**
- **Encryption Mode**: Full (strict)
- **Always Use HTTPS**: Enabled
- **Minimum TLS**: 1.2
- **HSTS**: Enabled with 6 months

---

## 📧 Phase 3: SendGrid Configuration

### **3.1 SendGrid Setup**
1. **Create Account**: Sign up at SendGrid
2. **Verify Domain**: Add `willworkforlunch.com` for sender verification
3. **Generate API Key**: Create API key with Mail Send permissions
4. **DNS Records**: Add SendGrid DNS records to CloudFlare for domain verification

### **3.2 Required DNS Records for SendGrid**
Add these records to CloudFlare (SendGrid will provide specific values):
```
Type    Name                    Content
CNAME   em1234                  u1234.wl.sendgrid.net
CNAME   s1._domainkey          s1.domainkey.u1234.wl.sendgrid.net  
CNAME   s2._domainkey          s2.domainkey.u1234.wl.sendgrid.net
```

---

## 💻 Phase 4: Application Deployment

### **4.1 Prepare Application Directory**
```bash
# Create application directory
mkdir -p /home/deploy/personal-website
cd /home/deploy/personal-website

# Clone repository (replace with your repo URL)
git clone https://github.com/your-username/personal-website-gen.git .

# Create SSL directories
mkdir -p ssl ssl-challenges
```

### **4.2 Configure Environment Variables**
```bash
# Create production environment file
nano .env.production
```

Add this content to `.env.production`:
```bash
NODE_ENV=production
NEXTAUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=https://willworkforlunch.com
NEXT_PUBLIC_SITE_URL=https://willworkforlunch.com
DOMAIN_NAME=willworkforlunch.com

# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@db:5432/personal_website
POSTGRES_DB=personal_website
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD

# Redis Configuration  
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD

# SendGrid Email Configuration
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
FROM_EMAIL=admin@willworkforlunch.com
ADMIN_EMAIL=admin@willworkforlunch.com
CONTACT_EMAIL=contact@willworkforlunch.com

# Legacy SMTP variables (keep for compatibility)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY

# Security
CRON_SECRET=your-secure-cron-secret
```

### **4.3 Update SendGrid Integration**
We need to update your email service to use SendGrid instead of nodemailer:

```bash
# Install SendGrid SDK
npm install @sendgrid/mail
```

---

## 🗄️ Phase 5: Database & Content Migration

### **5.1 Prepare Migration Data**
On your local development machine:
```cmd
# Create fresh backup
cd backups
backup-immediate.bat

# Note the backup ID for migration
```

### **5.2 Transfer Data to Production**
```bash
# From local machine, transfer backup to server
scp -r backups/database/backup_20250715_*.sql.gz deploy@YOUR_DROPLET_IP:/home/deploy/personal-website/
scp -r backups/content/ deploy@YOUR_DROPLET_IP:/home/deploy/personal-website/
```

### **5.3 Database Schema & Data Migration**
```bash
# On production server
cd /home/deploy/personal-website

# Start database container first
docker-compose -f docker-compose.prod.yml up -d db

# Wait for database to be healthy
docker-compose -f docker-compose.prod.yml logs db

# Import database schema and data
gunzip backup_20250715_*.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website < backup_20250715_*.sql
```

### **5.4 Media Files Migration**
```bash
# Create uploads directory structure
mkdir -p public/uploads/{general,post,project,newsletter}

# Copy media files from backup
cp -r content/uploads/* public/uploads/
cp -r content/images/* public/images/

# Set proper permissions
sudo chown -R deploy:deploy public/
chmod -R 755 public/
```

---

## 🔒 Phase 6: SSL & Nginx Configuration

### **6.1 Initial Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/willworkforlunch.com
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name willworkforlunch.com www.willworkforlunch.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name willworkforlunch.com www.willworkforlunch.com;
    
    # SSL configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/willworkforlunch.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/willworkforlunch.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Proxy to Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files optimization
    location /uploads/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /images/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### **6.2 Enable Site & SSL**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/willworkforlunch.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d willworkforlunch.com -d www.willworkforlunch.com --email admin@willworkforlunch.com --agree-tos --no-eff-email

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🚀 Phase 7: Launch Application

### **7.1 Start Production Services**
```bash
cd /home/deploy/personal-website

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app
```

### **7.2 Verify Deployment**
Check these endpoints:
- [ ] `https://willworkforlunch.com` - Homepage loads
- [ ] `https://willworkforlunch.com/admin` - Admin panel accessible  
- [ ] `https://willworkforlunch.com/blog` - Blog posts display
- [ ] `https://willworkforlunch.com/projects` - Projects display
- [ ] `https://willworkforlunch.com/api/health` - Returns 200 OK

---

## 📊 Phase 8: Production Backup System

### **8.1 Create Production Backup Script**
```bash
nano /home/deploy/backup-production.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/deploy/backups"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /home/deploy/personal-website/docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz

# Content backup
tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C /home/deploy/personal-website public/uploads public/images

# Config backup
tar -czf $BACKUP_DIR/config_$BACKUP_DATE.tar.gz -C /home/deploy/personal-website .env.production docker-compose.prod.yml nginx.conf

echo "Backup completed: $BACKUP_DATE"
```

### **8.2 Schedule Automated Backups**
```bash
# Make script executable
chmod +x /home/deploy/backup-production.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/deploy/backup-production.sh >> /home/deploy/backup.log 2>&1
```

---

## ✅ Post-Deployment Checklist

### **Functionality Testing**
- [ ] All pages load correctly with HTTPS
- [ ] Admin authentication works
- [ ] Blog posts and projects display with correct data
- [ ] Media files/images load properly  
- [ ] Contact forms send emails via SendGrid
- [ ] Newsletter subscription works
- [ ] Admin panel fully functional

### **Performance & Security**
- [ ] SSL Labs test shows A+ rating
- [ ] Page load times < 3 seconds
- [ ] Database queries performing well
- [ ] All security headers present
- [ ] Backup system working

### **Monitoring Setup**
- [ ] Log rotation configured
- [ ] Health monitoring in place
- [ ] Automated backups scheduled
- [ ] Alert system configured

---

## 🚨 Emergency Procedures

### **Rollback Process**
```bash
# Stop current services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
gunzip /home/deploy/backups/database_BACKUP_ID.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website < /home/deploy/backups/database_BACKUP_ID.sql

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### **Log Locations**
- **Application**: `docker-compose -f docker-compose.prod.yml logs app`
- **Database**: `docker-compose -f docker-compose.prod.yml logs db`  
- **Nginx**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **System**: `/var/log/syslog`

---

## 📞 Support Information

**Useful Commands:**
```bash
# Service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Database access
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d personal_website
```

**Key Files:**
- Application: `/home/deploy/personal-website/`
- Environment: `/home/deploy/personal-website/.env.production`
- Backups: `/home/deploy/backups/`
- Nginx Config: `/etc/nginx/sites-available/willworkforlunch.com`
- SSL Certs: `/etc/letsencrypt/live/willworkforlunch.com/`

---

*This guide ensures complete migration of your database (users, posts, projects, pages, categories, media files, profiles, and all content) along with media files and production-ready security configurations.* 