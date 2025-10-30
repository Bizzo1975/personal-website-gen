# 🏠 Local Server Deployment Guide - willworkforlunch.com
## Complete Step-by-Step Deployment to Your Local Server + CloudFlare

---

## 📋 **Pre-Launch Checklist**

### **Current Project Status** ✅
- **Application**: Next.js 15.4.1, TypeScript, PostgreSQL 15, Redis 7
- **Security**: All vulnerabilities resolved (0 vulnerabilities)
- **Backup**: Latest backup ID `20250715_193636` (27 MB total)
- **Database**: 2 users, 4 posts, 35 projects, 5 pages, 47 media files
- **Media Files**: Organized in `/public/uploads/` with database metadata
- **Docker**: Production-ready configurations available
- **Content**: Fully populated with real data (NO MOCK DATA)

### **Required Information** (Fill these out before starting)
```bash
# Local Server Details
SERVER_IP=________________ (Your server's public IP address)
SERVER_USER=________________ (Your server username)
SERVER_OS=________________ (Ubuntu/CentOS/Debian)

# CloudFlare
CLOUDFLARE_EMAIL=________________
DOMAIN_NAME=willworkforlunch.com

# Secure Passwords (Generate 32+ character secrets)
NEXTAUTH_SECRET=________________
POSTGRES_PASSWORD=________________
REDIS_PASSWORD=________________
CRON_SECRET=________________

# Email (Choose one)
# Option A: SendGrid
SENDGRID_API_KEY=________________
# Option B: Gmail SMTP
GMAIL_APP_PASSWORD=________________
```

---

## 🎯 **Phase 1: Local Server Preparation**

### **1.1 Server Requirements**
Your local server should meet these minimum specifications:
- **OS**: Ubuntu 20.04 LTS or newer (or CentOS 8+, Debian 11+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB free space
- **CPU**: Minimum 2 cores, Recommended 4+ cores
- **Network**: Static public IP address
- **Access**: SSH access with sudo privileges

### **1.2 Connect to Your Server**
```bash
# Connect to your local server
ssh YOUR_SERVER_USER@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y
```

### **1.3 Install Dependencies**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install additional tools
sudo apt install -y nginx certbot python3-certbot-nginx git curl wget htop

# Add your user to docker group
sudo usermod -aG docker $USER
```

### **1.4 Security Configuration**
```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 🌐 **Phase 2: CloudFlare Configuration**

### **2.1 Domain Setup**
1. **Login to CloudFlare** → Add a Site
2. **Enter Domain**: `willworkforlunch.com`
3. **Choose Plan**: Free plan is sufficient
4. **Update Nameservers**: Point your domain to CloudFlare nameservers
5. **Wait for Propagation**: Usually takes 2-24 hours

### **2.2 DNS Records Configuration**
In CloudFlare DNS settings, add these records:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | YOUR_SERVER_IP | Proxied (Orange Cloud) |
| A | www | YOUR_SERVER_IP | Proxied (Orange Cloud) |
| CNAME | admin | willworkforlunch.com | Proxied (Orange Cloud) |

### **2.3 SSL/TLS Settings**
- **Encryption Mode**: Full (strict)
- **Always Use HTTPS**: Enabled
- **Minimum TLS**: 1.2
- **HSTS**: Enabled with 6 months

---

## 📧 **Phase 3: Email Configuration**

### **Option A: SendGrid (Recommended)**
1. **Create SendGrid Account**: https://sendgrid.com
2. **Verify Domain**: Add `willworkforlunch.com` for sender verification
3. **Generate API Key**: Create API key with Mail Send permissions
4. **Add DNS Records**: Add SendGrid DNS records to CloudFlare

### **Option B: Gmail SMTP**
1. **Enable 2FA** on your Gmail account
2. **Generate App Password**: Google Account → Security → App passwords
3. **Use App Password** as SMTP_PASS

---

## 💻 **Phase 4: Application Deployment**

### **4.1 Prepare Application Directory**
```bash
# Create application directory
mkdir -p ~/personal-website
cd ~/personal-website

# Clone your repository (replace with your actual repo)
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

# Email Configuration (Choose one)
# Option A: SendGrid
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
FROM_EMAIL=admin@willworkforlunch.com
ADMIN_EMAIL=admin@willworkforlunch.com
CONTACT_EMAIL=contact@willworkforlunch.com

# Option B: Gmail SMTP
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=admin@willworkforlunch.com
# SMTP_PASS=YOUR_GMAIL_APP_PASSWORD

# Security
CRON_SECRET=your-secure-cron-secret
```

### **4.3 Deploy Application**
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs app
```

---

## 🗄️ **Phase 5: Database & Content Migration**

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
# From local development machine, transfer backup to server
scp -r backups/database/backup_20250715_*.sql.gz YOUR_SERVER_USER@YOUR_SERVER_IP:~/personal-website/
scp -r backups/content/ YOUR_SERVER_USER@YOUR_SERVER_IP:~/personal-website/
```

### **5.3 Database Schema & Data Migration**
```bash
# On production server
cd ~/personal-website

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
chmod -R 755 public/
```

---

## 🔒 **Phase 6: SSL & Nginx Configuration**

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

## 🚀 **Phase 7: Launch Application**

### **7.1 Start Production Services**
```bash
cd ~/personal-website

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

## 📊 **Phase 8: Production Backup System**

### **8.1 Create Production Backup Script**
```bash
nano ~/backup-production.sh
```

Add this content:
```bash
#!/bin/bash
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="~/backups"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f ~/personal-website/docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz

# Content backup
tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C ~/personal-website public/uploads public/images

# Config backup
tar -czf $BACKUP_DIR/config_$BACKUP_DATE.tar.gz -C ~/personal-website .env.production docker-compose.prod.yml nginx.conf

echo "Backup completed: $BACKUP_DATE"
```

### **8.2 Schedule Automated Backups**
```bash
# Make script executable
chmod +x ~/backup-production.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * ~/backup-production.sh >> ~/backup.log 2>&1
```

---

## ✅ **Post-Deployment Checklist**

### **Functionality Testing**
- [ ] All pages load correctly with HTTPS
- [ ] Admin authentication works
- [ ] Blog posts and projects display with correct data
- [ ] Media files/images load properly  
- [ ] Contact forms send emails
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

## 🚨 **Emergency Procedures**

### **Rollback Process**
```bash
# Stop current services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
gunzip ~/backups/database_BACKUP_ID.sql.gz
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d personal_website < ~/backups/database_BACKUP_ID.sql

# Restart services
docker-compose -f docker-compose.prod.yml up -d
```

### **Log Locations**
- **Application**: `docker-compose -f docker-compose.prod.yml logs app`
- **Database**: `docker-compose -f docker-compose.prod.yml logs db`  
- **Nginx**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **System**: `/var/log/syslog`

---

## 📞 **Support Information**

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
- Application: `~/personal-website/`
- Environment: `~/personal-website/.env.production`
- Backups: `~/backups/`
- Nginx Config: `/etc/nginx/sites-available/willworkforlunch.com`
- SSL Certs: `/etc/letsencrypt/live/willworkforlunch.com/`

---

## 🎯 **Quick Start Commands**

### **Complete Deployment in One Go**
```bash
# 1. Setup server
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Deploy application
cd ~/personal-website
docker-compose -f docker-compose.prod.yml up -d

# 3. Setup SSL
sudo certbot --nginx -d willworkforlunch.com -d www.willworkforlunch.com
```

---

## 🔧 **Local Server Specific Notes**

### **Network Configuration**
- Ensure your router forwards ports 80 and 443 to your server
- Configure static IP for your server
- Update CloudFlare DNS with your server's public IP

### **Firewall Considerations**
- Your local network firewall should allow HTTP/HTTPS traffic
- Consider using CloudFlare Tunnel for additional security
- Monitor your server's security logs regularly

### **Backup Strategy**
- Store backups on external drives or cloud storage
- Test restore procedures regularly
- Consider off-site backup solutions

---

*This guide ensures complete migration of your database (users, posts, projects, pages, categories, media files, profiles, and all content) along with media files and production-ready security configurations for your local server setup.*
