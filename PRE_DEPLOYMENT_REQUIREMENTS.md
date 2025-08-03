# Pre-Deployment Requirements Checklist

## 🎯 Current System Status (✅ COMPLETED)
- ✅ **Latest Backup Created**: ID `20250715_193636` (Current as of deployment prep)
- ✅ **All Containers Shutdown**: Docker containers successfully stopped and removed
- ✅ **Ports Closed**: All related ports (3006, 5436, 8086, 6379) are now closed
- ✅ **Security Updates**: All vulnerabilities resolved (0 vulnerabilities)
- ✅ **Project Organization**: Clean file structure with organized backup system

---

## 📋 REQUIRED ITEMS TO GATHER BEFORE DEPLOYMENT

### **🔐 1. Digital Ocean Account & Resources**
- [ ] **Digital Ocean Account**
  - [ ] Account created and verified
  - [ ] Payment method added and verified
  - [ ] SSH keys generated and uploaded to DO
  - [ ] Account has sufficient credits/billing setup

- [ ] **SSH Key Information**
  - [ ] Public key uploaded to Digital Ocean: `________________`
  - [ ] Private key location on local machine: `________________`
  - [ ] SSH key passphrase (if applicable): `________________`

### **🌐 2. Domain & CloudFlare Setup**
- [ ] **Domain Ownership**
  - [ ] Domain `willworkforlunch.com` purchased and accessible
  - [ ] Domain registrar login credentials: `________________`
  - [ ] Domain expiration date: `________________`

- [ ] **CloudFlare Account**
  - [ ] CloudFlare account created and verified
  - [ ] Login credentials secure and accessible
  - [ ] Domain added to CloudFlare account
  - [ ] CloudFlare nameservers noted:
    - [ ] Nameserver 1: `________________`
    - [ ] Nameserver 2: `________________`

### **📧 3. Email Configuration**
- [ ] **SMTP Provider Setup**
  - [ ] Gmail/Google Workspace account: `admin@willworkforlunch.com`
  - [ ] App-specific password generated for SMTP
  - [ ] 2FA enabled on email account
  - [ ] SMTP credentials documented securely

- [ ] **Email Addresses**
  - [ ] Admin email: `admin@willworkforlunch.com`
  - [ ] Contact email: `contact@willworkforlunch.com`
  - [ ] Both emails accessible and configured

### **🔒 4. Security Credentials & Secrets**
- [ ] **Production Secrets** (Generate 32+ character strings)
  - [ ] NEXTAUTH_SECRET: `________________`
  - [ ] POSTGRES_PASSWORD: `________________`
  - [ ] REDIS_PASSWORD: `________________`
  - [ ] CRON_SECRET: `________________`

- [ ] **Database Credentials**
  - [ ] Database name: `personal_website` (fixed)
  - [ ] Database user: `postgres` (fixed)
  - [ ] Secure database password: `________________`

### **💻 5. Server Information**
- [ ] **Digital Ocean Droplet**
  - [ ] Droplet created with minimum specs:
    - [ ] 2 vCPUs, 4GB RAM, 80GB SSD (minimum)
    - [ ] 4 vCPUs, 8GB RAM, 160GB SSD (recommended)
  - [ ] Ubuntu 22.04 LTS selected
  - [ ] Droplet IP address: `________________`
  - [ ] Region selected: `________________`

- [ ] **Server Access**
  - [ ] SSH access to droplet confirmed
  - [ ] Root login working
  - [ ] Server accessible via: `ssh root@YOUR_DROPLET_IP`

### **📦 6. Code Repository & Deployment**
- [ ] **Repository Information**
  - [ ] Git repository URL: `________________`
  - [ ] Repository access credentials (if private)
  - [ ] Deployment branch: `________________`
  - [ ] Latest commit hash: `________________`

- [ ] **Local Development Environment**
  - [ ] Application tested locally and working
  - [ ] All dependencies installed
  - [ ] No critical errors in local testing

### **🔄 7. Backup & Migration Data**
- [ ] **Current Backup Status**
  - [ ] Latest backup ID: `20250715_193636`
  - [ ] Backup size: `~10.4 MB`
  - [ ] Database records: 2 users, 4 posts, 35 projects, 5 pages, 47 media files
  - [ ] All backup files present in `backups/` directory

- [ ] **Migration Planning**
  - [ ] Database migration strategy confirmed
  - [ ] Content migration plan ready
  - [ ] Admin user credentials for production noted

### **📋 8. Environment Configuration**
- [ ] **Production Environment Variables**
  ```bash
  # Ensure you have values for all of these:
  NODE_ENV=production
  NEXTAUTH_SECRET=________________
  NEXTAUTH_URL=https://willworkforlunch.com
  NEXT_PUBLIC_SITE_URL=https://willworkforlunch.com
  DOMAIN_NAME=willworkforlunch.com
  DATABASE_URL=postgresql://postgres:________________@db:5432/personal_website
  POSTGRES_DB=personal_website
  POSTGRES_USER=postgres
  POSTGRES_PASSWORD=________________
  REDIS_URL=redis://redis:6379
  REDIS_PASSWORD=________________
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=admin@willworkforlunch.com
  SMTP_PASS=________________
  ADMIN_EMAIL=admin@willworkforlunch.com
  CONTACT_EMAIL=contact@willworkforlunch.com
  CRON_SECRET=________________
  ```

### **🛠️ 9. Tools & Software**
- [ ] **Local Machine Requirements**
  - [ ] Git installed and configured
  - [ ] SSH client available
  - [ ] SCP/SFTP client for file transfers
  - [ ] Text editor for configuration files

- [ ] **Optional Tools**
  - [ ] Docker Desktop (for local testing)
  - [ ] Database client (for database management)
  - [ ] FTP/SFTP client (FileZilla, WinSCP, etc.)

### **🔍 10. Testing & Validation**
- [ ] **Pre-deployment Testing**
  - [ ] Local application fully functional
  - [ ] Database connectivity tested
  - [ ] Admin panel accessible
  - [ ] Email functionality tested (if configured)

- [ ] **Monitoring Setup**
  - [ ] Plan for monitoring application health
  - [ ] Log management strategy
  - [ ] Backup verification process

---

## 📊 DEPLOYMENT READINESS VERIFICATION

### **System Status Check**
Run these commands to verify your system is ready:

```bash
# 1. Verify backup is current
dir backups\database\ /od
# Should show backup from today: 20250715_193636

# 2. Verify no containers running
docker ps
# Should show no containers

# 3. Verify ports are closed
netstat -ano | findstr ":3006\|:5436\|:8086\|:6379"
# Should return no results

# 4. Verify application dependencies
npm audit
# Should show: 0 vulnerabilities

# 5. Verify backup system works
cd backups && backup-immediate.bat
# Should complete successfully
```

### **Information Gathering Checklist**
- [ ] **All passwords and secrets generated and documented securely**
- [ ] **All IP addresses and server information documented**
- [ ] **All email accounts configured and accessible**
- [ ] **All DNS and domain information ready**
- [ ] **All repository and code information available**

### **Security Checklist**
- [ ] **All secrets stored securely (not in plain text files)**
- [ ] **SSH keys properly secured**
- [ ] **2FA enabled on all critical accounts**
- [ ] **Backup system tested and verified**
- [ ] **Local development environment secured**

---

## 🚀 READY TO DEPLOY?

### **Final Pre-Deployment Verification**
Before starting deployment, confirm:

1. **✅ All items above are checked and completed**
2. **✅ Latest backup created and verified**
3. **✅ All containers shutdown and ports closed**
4. **✅ All required information gathered and documented**
5. **✅ Security credentials generated and stored securely**
6. **✅ Server access confirmed and working**
7. **✅ Domain and CloudFlare configuration ready**

### **Next Steps**
Once all requirements are met:
1. Review `PRE_DEPLOYMENT_CHECKLIST.md` for deployment steps
2. Follow `DEPLOYMENT_PLAN.md` for complete deployment guide
3. Keep this requirements checklist handy for reference

### **Emergency Contacts & Information**
- **Digital Ocean Support**: Available if server issues arise
- **CloudFlare Support**: Available for DNS/SSL issues
- **Domain Registrar**: Contact info for domain issues
- **Email Provider**: Support for SMTP issues

---

## 🔐 SECURITY REMINDERS

- **Never commit secrets to version control**
- **Use secure password managers for all credentials**
- **Enable 2FA on all critical accounts**
- **Keep backup of all access credentials**
- **Test backup and restore procedures before deployment**

---

*Complete this checklist before proceeding with deployment. Missing items may cause deployment failures or security vulnerabilities.* 