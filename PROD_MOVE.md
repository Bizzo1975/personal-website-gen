# Production Deployment Plan - Personal Website
## Moving to willworkforlunch.com on Digital Ocean

### 📋 Executive Summary
This document outlines the complete step-by-step process to deploy your personal website from development to production using:
- **Domain**: willworkforlunch.com (Cloudflare managed)
- **Hosting**: Digital Ocean Droplet
- **Database**: MongoDB Atlas (Production tier)
- **CDN**: Cloudflare
- **SSL**: Cloudflare SSL/TLS

---

## 🎯 Pre-Production Checklist

### Current Project Status
✅ **Completed Features**:
- Next.js 14 application with TypeScript
- Admin panel with authentication (NextAuth.js)
- Blog system with commenting
- Project showcase
- Newsletter signup integration
- Contact form
- Responsive design with Tailwind CSS
- Docker containerization ready
- Testing suite (Jest + Cypress)

⚠️ **Critical Items to Address**:
- Production environment variables
- Database migration from development to production
- SSL certificate configuration
- Performance optimization
- Security hardening
- Monitoring setup

---

## 🚀 Phase 1: Infrastructure Setup (Days 1-2)

### 1.1 Digital Ocean Droplet Setup

**Step 1: Create Droplet**
```bash
# Recommended Specifications:
# - Ubuntu 22.04 LTS
# - 2 vCPUs, 4GB RAM, 80GB SSD ($24/month)
# - Enable monitoring and backups
# - Add SSH key for secure access
```

**Step 2: Initial Server Configuration**
```bash
# Connect to droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw fail2ban

# Create non-root user
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

**Step 3: Install Node.js and Docker**
```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker deploy

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 1.2 Domain and DNS Configuration

**Step 1: Cloudflare DNS Setup**
```bash
# Add these DNS records in Cloudflare:
# A record: @ -> your-droplet-ip
# A record: www -> your-droplet-ip
# CNAME record: api -> willworkforlunch.com
```

**Step 2: Cloudflare SSL/TLS Configuration**
- Set SSL/TLS encryption mode to "Full (strict)"
- Enable "Always Use HTTPS"
- Enable "HTTP Strict Transport Security (HSTS)"
- Enable "Automatic HTTPS Rewrites"

### 1.3 MongoDB Atlas Production Setup

**Step 1: Create Production Cluster**
```bash
# MongoDB Atlas Configuration:
# - Cluster Tier: M10 (2GB RAM, 10GB Storage) - $57/month
# - Region: Same as Digital Ocean droplet for low latency
# - Enable backup (Point-in-time recovery)
# - Set up database user with strong password
```

**Step 2: Network Security**
```bash
# Whitelist your droplet IP in MongoDB Atlas
# Add 0.0.0.0/0 temporarily for initial setup (remove after testing)
```

---

## 🔧 Phase 2: Application Deployment (Days 3-4)

### 2.1 Repository and Code Preparation

**Step 1: Create Production Branch**
```bash
# On your local machine
git checkout -b production
git push origin production
```

**Step 2: Production Environment Configuration**
Create `.env.production` file:
```env
# Production Environment Variables
NODE_ENV=production
FRONTEND_PORT=3006
FRONTEND_URL=https://willworkforlunch.com
API_URL=https://willworkforlunch.com/api

# NextAuth Configuration
NEXTAUTH_SECRET=generate-new-64-char-secret-here
NEXTAUTH_URL=https://willworkforlunch.com
NEXTAUTH_URL_INTERNAL=http://localhost:3006

# MongoDB Atlas Production
MONGODB_URI=mongodb+srv://prod-user:strong-password@cluster.mongodb.net/personal_website_prod?retryWrites=true&w=majority
DB_NAME=personal_website_prod

# Security Settings
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/personal-website/application.log

# Disable development features
MOCK_DATA=false
NEXT_TELEMETRY_DISABLED=1
```

### 2.2 Production Docker Configuration

**Step 1: Create Production Docker Compose**
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: personal-website-prod
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=production
      - FRONTEND_PORT=3006
    env_file:
      - .env.production
    volumes:
      - ./logs:/var/log/personal-website
      - ./public/uploads:/app/public/uploads
    restart: unless-stopped
    networks:
      - personal-website-network

networks:
  personal-website-network:
    driver: bridge
```

**Step 2: Update Dockerfile for Production**
Ensure your Dockerfile has proper production optimizations (already configured).

### 2.3 Server Deployment

**Step 1: Deploy Application to Server**
```bash
# On your local machine
rsync -avz --exclude node_modules --exclude .git --exclude .next . deploy@your-droplet-ip:/home/deploy/personal-website/

# On the server
ssh deploy@your-droplet-ip
cd /home/deploy/personal-website

# Install dependencies and build
npm ci --only=production
npm run build

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔒 Phase 3: Security and Performance (Days 5-6)

### 3.1 Nginx Reverse Proxy Configuration

**Step 1: Configure Nginx**
Create `/etc/nginx/sites-available/willworkforlunch.com`:
```nginx
server {
    listen 80;
    server_name willworkforlunch.com www.willworkforlunch.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name willworkforlunch.com www.willworkforlunch.com;

    # SSL Configuration (Cloudflare Origin Certificate)
    ssl_certificate /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3006;
    }
}
```

**Step 2: Enable Site and Restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/willworkforlunch.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3.2 Firewall Configuration

**Step 1: Configure UFW**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

**Step 2: Configure Fail2Ban**
Create `/etc/fail2ban/jail.local`:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

### 3.3 SSL Certificate Setup

**Step 1: Generate Cloudflare Origin Certificate**
- Go to Cloudflare Dashboard → SSL/TLS → Origin Server
- Create Certificate (15-year validity)
- Save certificate as `/etc/ssl/certs/cloudflare-origin.pem`
- Save private key as `/etc/ssl/private/cloudflare-origin.key`

```bash
sudo chmod 644 /etc/ssl/certs/cloudflare-origin.pem
sudo chmod 600 /etc/ssl/private/cloudflare-origin.key
```

---

## 📊 Phase 4: Monitoring and Analytics (Day 7)

### 4.1 Application Monitoring

**Step 1: Install PM2 for Process Management**
```bash
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'personal-website',
    script: 'npm',
    args: 'start',
    cwd: '/home/deploy/personal-website',
    env: {
      NODE_ENV: 'production',
      PORT: 3006
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/personal-website/err.log',
    out_file: '/var/log/personal-website/out.log',
    log_file: '/var/log/personal-website/combined.log',
    time: true
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Step 2: Log Management**
```bash
# Create log directory
sudo mkdir -p /var/log/personal-website
sudo chown deploy:deploy /var/log/personal-website

# Configure log rotation
sudo tee /etc/logrotate.d/personal-website << EOF
/var/log/personal-website/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

### 4.2 System Monitoring

**Step 1: Install Monitoring Tools**
```bash
# Install htop, iotop, and other monitoring tools
sudo apt install -y htop iotop nethogs

# Install and configure Netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

**Step 2: Database Monitoring**
- Enable MongoDB Atlas monitoring
- Set up alerts for high CPU, memory usage
- Configure backup schedules

---

## 🔄 Phase 5: Deployment Automation (Day 8)

### 5.1 Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment to production..."

# Variables
DEPLOY_USER="deploy"
SERVER_IP="your-droplet-ip"
APP_DIR="/home/deploy/personal-website"
BACKUP_DIR="/home/deploy/backups"

# Create backup
echo "📦 Creating backup..."
ssh $DEPLOY_USER@$SERVER_IP "mkdir -p $BACKUP_DIR && tar -czf $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz -C $APP_DIR ."

# Deploy new code
echo "📤 Deploying new code..."
rsync -avz --exclude node_modules --exclude .git --exclude .next --exclude logs . $DEPLOY_USER@$SERVER_IP:$APP_DIR/

# Install dependencies and build
echo "🔨 Building application..."
ssh $DEPLOY_USER@$SERVER_IP "cd $APP_DIR && npm ci --only=production && npm run build"

# Restart application
echo "🔄 Restarting application..."
ssh $DEPLOY_USER@$SERVER_IP "cd $APP_DIR && pm2 restart personal-website"

# Health check
echo "🏥 Performing health check..."
sleep 10
if curl -f https://willworkforlunch.com/api/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
```

### 5.2 GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ production ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /home/deploy/personal-website
          git pull origin production
          npm ci --only=production
          npm run build
          pm2 restart personal-website
```

---

## 🧪 Phase 6: Testing and Optimization (Days 9-10)

### 6.1 Performance Testing

**Step 1: Load Testing**
```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test website performance
ab -n 1000 -c 10 https://willworkforlunch.com/

# Test API endpoints
ab -n 500 -c 5 https://willworkforlunch.com/api/health
```

**Step 2: Lighthouse Audit**
```bash
# Run Lighthouse audit
npm run lighthouse
```

### 6.2 Security Testing

**Step 1: SSL Testing**
```bash
# Test SSL configuration
curl -I https://willworkforlunch.com
openssl s_client -connect willworkforlunch.com:443 -servername willworkforlunch.com
```

**Step 2: Security Headers Check**
```bash
# Check security headers
curl -I https://willworkforlunch.com | grep -E "(X-Frame-Options|X-XSS-Protection|X-Content-Type-Options|Strict-Transport-Security)"
```

---

## 📋 Phase 7: Go-Live Checklist (Day 11)

### 7.1 Pre-Launch Verification

- [ ] Domain resolves correctly to server IP
- [ ] SSL certificate is valid and trusted
- [ ] All pages load without errors
- [ ] Admin panel is accessible and functional
- [ ] Database connection is working
- [ ] Email functionality is working
- [ ] Newsletter signup is functional
- [ ] Contact form submissions work
- [ ] Blog posts and comments work
- [ ] Project showcase displays correctly
- [ ] Mobile responsiveness verified
- [ ] Performance metrics are acceptable
- [ ] Security headers are present
- [ ] Backup system is operational
- [ ] Monitoring is active

### 7.2 DNS Cutover

**Step 1: Final DNS Configuration**
```bash
# Update Cloudflare DNS to point to production server
# Remove any temporary DNS entries
# Verify propagation with: dig willworkforlunch.com
```

**Step 2: Remove Development Restrictions**
- Remove IP whitelist from MongoDB Atlas
- Update CORS settings if needed
- Enable production analytics

---

## 🔧 Phase 8: Post-Launch Maintenance

### 8.1 Backup Strategy

**Daily Automated Backups**:
```bash
# Create backup script
cat > /home/deploy/scripts/backup.sh << EOF
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/home/deploy/backups"
APP_DIR="/home/deploy/personal-website"

# Create application backup
tar -czf $BACKUP_DIR/app-backup-$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "app-backup-*.tar.gz" -mtime +7 -delete

# MongoDB Atlas handles database backups automatically
EOF

# Add to crontab
echo "0 2 * * * /home/deploy/scripts/backup.sh" | crontab -
```

### 8.2 Update Strategy

**Monthly Updates**:
1. Security patches for Ubuntu
2. Node.js and npm updates
3. Dependency updates
4. SSL certificate renewal (automatic with Cloudflare)

### 8.3 Monitoring and Alerts

**Set up alerts for**:
- Server downtime
- High CPU/memory usage
- Database connection issues
- SSL certificate expiration
- Disk space usage

---

## 💰 Cost Breakdown

### Monthly Costs:
- **Digital Ocean Droplet**: $24/month (2 vCPU, 4GB RAM)
- **MongoDB Atlas M10**: $57/month
- **Cloudflare Pro** (optional): $20/month
- **Domain Registration**: ~$12/year
- **Total**: ~$101-121/month

### One-time Costs:
- **Setup and Configuration**: 8-11 days of work
- **SSL Certificate**: Free (Cloudflare)
- **Monitoring Tools**: Free (basic tier)

---

## 🚨 Critical Security Notes

1. **Never commit production environment variables to Git**
2. **Use strong, unique passwords for all services**
3. **Enable 2FA on all accounts (Cloudflare, Digital Ocean, MongoDB Atlas)**
4. **Regularly update all dependencies and system packages**
5. **Monitor logs for suspicious activity**
6. **Keep regular backups and test restore procedures**

---

## 📞 Emergency Contacts and Procedures

### Rollback Procedure:
1. Stop current application: `pm2 stop personal-website`
2. Restore from backup: `tar -xzf backup-file.tar.gz`
3. Restart application: `pm2 start personal-website`
4. Verify functionality

### Support Contacts:
- **Digital Ocean Support**: Available 24/7
- **MongoDB Atlas Support**: Business hours
- **Cloudflare Support**: 24/7 (Pro plan)

---

## ✅ Success Metrics

### Performance Targets:
- **Page Load Time**: < 3 seconds
- **Time to First Byte**: < 1 second
- **Lighthouse Score**: > 90
- **Uptime**: > 99.9%

### Security Targets:
- **SSL Rating**: A+ (SSL Labs)
- **Security Headers**: All implemented
- **Vulnerability Scans**: Clean results

---

This comprehensive plan will take your personal website from development to a production-ready deployment on willworkforlunch.com. Follow each phase carefully, and don't hesitate to test thoroughly at each step before proceeding to the next phase.