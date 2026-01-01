# Development VM Setup Guide

This guide provides step-by-step instructions for setting up a development Ubuntu Server VM on your Proxmox host, sharing the same DMZ network (VLAN 20) as your production website.

**Architecture Overview:**
- **Development VM IP:** 192.168.20.10 (DMZ network - VLAN 20)
- **Production VM IP:** 192.168.20.20 (DMZ network - VLAN 20)
- **Network Bridge:** vmbr20 (same as production)
- **Development Port:** 3006 (production uses 3000)
- Both VMs can run simultaneously on the same Proxmox host

---

## Prerequisites

Before starting, ensure you have:
- ✅ Proxmox host configured with VLANs (Step 1-4 of Proxmox Master Plan)
- ✅ DMZ network bridge (vmbr20) configured on Proxmox
- ✅ NAT configured for DMZ internet access (Step 4 of Proxmox Master Plan)
- ✅ Access to Proxmox web interface via Tailscale
- ✅ Ubuntu Server 24.04 LTS ISO downloaded in Proxmox

---

## Step 1: Create the Development VM in Proxmox

### Step 1.1: Access Proxmox Web Interface

1. **Open Proxmox web interface:**
   - Access via Tailscale: `https://<proxmox-tailscale-ip>:8006`
   - Log in with your Proxmox credentials

### Step 1.2: Create New VM

1. **Click "Create VM" button:**
   - Top right corner of the Proxmox interface
   - Or right-click on your Proxmox node → "Create VM"

2. **General Tab:**
   - **VM ID:** Auto-generated (e.g., 100) - **Note this down** (must be different from production VM ID)
   - **Name:** `ubuntu-dev-webserver` (or `ubuntu-development` - make it clear this is development)
   - **Resource Pool:** Leave default
   - Click **Next**

3. **OS Tab:**
   - **Use CD/DVD disc image file (iso):** Select this
   - **Storage:** Choose where to store the ISO (usually `local`)
   - **ISO image:** Click dropdown and select **Ubuntu Server 24.04 LTS**
     - If not listed, click **"Download"** and search for "Ubuntu Server 24.04"
     - Download the ISO (this may take a few minutes)
   - Click **Next**

4. **System Tab:**
   - **Graphic card:** Default (std)
   - **Machine:** Default (i440fx)
   - **BIOS:** Default (SeaBIOS)
   - **SCSI controller:** Default (VirtIO SCSI single)
   - **Qemu agent:** **CHECK THIS BOX** (allows better VM management)
   - Click **Next**

5. **Hardware Tab:**
   - **Hard disk:**
     - **Bus/Device:** VirtIO Block
     - **Storage:** Choose your storage (usually `local-lvm`)
     - **Disk size:** `40` GB (minimum) - development needs more space for builds and dependencies
   - **CPU:**
     - **Sockets:** `1`
     - **Cores:** `2` (minimum) - 4 cores recommended for faster builds
   - **Memory:**
     - **Memory:** `4096` MB (4 GB minimum) - 8 GB recommended for development
   - Click **Next**

6. **Network Tab (CRITICAL - Must match production):**
   - **Bridge:** Select **vmbr20** (this is the DMZ bridge - same as production!)
   - **Model:** VirtIO (paravirtualized) - fastest option
   - **MAC address:** Auto-generated (leave as is)
   - **VLAN tag:** Leave empty (VLAN is handled by the bridge)
   - **Firewall:** Uncheck this (we're using network isolation instead)
   - Click **Next**

7. **Confirm:**
   - Review all settings
   - **Verify vmbr20 is selected for network** (same as production)
   - Click **Finish**

---

## Step 2: Install Ubuntu Server

### Step 2.1: Start and Install Ubuntu

1. **Start the VM:**
   - Find your new VM (`ubuntu-dev-webserver`) in the left sidebar
   - Click on it
   - Click **"Start"** button (top right)

2. **Open console:**
   - Click **"Console"** tab
   - You should see the Ubuntu installer

3. **Follow Ubuntu installation:**
   - **Language:** English (or your preference)
   - **Keyboard:** Your keyboard layout
   - **Network connections:** Should show "ens18" (or similar) - this is normal
   - **Proxy:** Leave blank unless you need one
   - **Ubuntu archive mirror:** Leave default
   - **Storage:** Use entire disk (guided)
   - **Profile setup:**
     - **Your name:** Enter your name
     - **Server name:** `dev-webserver` (or `development` - make it distinct from production)
     - **Username:** `dev-admin` (or your preferred username - different from production)
     - **Password:** Choose a strong password (write it down securely!)
   - **SSH Setup:** **CHECK "Install OpenSSH server"** (important!)
   - **Snaps:** Leave defaults or skip
   - **Installation will begin** - this takes 5-15 minutes

4. **After installation completes:**
   - It will prompt to reboot
   - The VM will restart
   - You'll see the login prompt

---

## Step 3: Configure Static IP Address

**Why:** We need a fixed IP address (192.168.20.10) for the development VM so we can always find it. Production uses 192.168.20.20.

### Step 3.1: Log In and Configure Network

1. **Log in to the VM:**
   - Use the username and password you set during installation

2. **Check network interface name:**
   ```bash
   ip link show
   ```
   
   **What to look for:** Note the interface name (usually `ens18`, `eth0`, or `enp0s3`)

3. **Edit network configuration:**
   ```bash
   sudo nano /etc/netplan/01-netcfg.yaml
   ```
   
   **What this does:** Opens the network configuration file in nano editor.

4. **Replace the entire file contents with:**
   ```yaml
   network:
     version: 2
     ethernets:
       ens18:
         dhcp4: no
         addresses: [192.168.20.10/24]
         routes:
           - to: default
             via: 192.168.20.1
         nameservers:
           addresses: [1.1.1.1, 8.8.8.8]
   ```
   
   **Breaking this down:**
   - `ens18`: Your network interface name (replace with actual name if different)
   - `dhcp4: no`: Don't use automatic IP assignment
   - `addresses: [192.168.20.10/24]`: Use this fixed IP address for development (production uses .20)
   - `via: 192.168.20.1`: Use Proxmox as the gateway (router)
   - `nameservers`: DNS servers for internet lookups (Cloudflare and Google)
   
   **Important:** If your network interface is NOT `ens18`, replace it with the correct name from Step 3.1.

5. **Save and exit:**
   - Press `Ctrl + O`, then `Enter`
   - Press `Ctrl + X`

6. **Apply the network configuration:**
   ```bash
   sudo netplan apply
   ```
   
   **What this does:** Applies the new network settings. Your connection might drop briefly.

7. **Verify it worked:**
   ```bash
   ip addr show
   ```
   
   **What to look for:** You should see `192.168.20.10` listed under your network interface.

8. **Test internet connectivity:**
   ```bash
   ping -c 3 8.8.8.8
   ```
   
   **What this does:** Tests if the VM can reach the internet. You should see 3 successful replies.
   
   **Also test isolation (should FAIL - this is correct!):**
   ```bash
   ping -c 3 192.168.1.1
   ping -c 3 192.168.10.10
   ```
   
   **What this does:** Tests that the DMZ is properly isolated. These should fail (timeout) - this is correct and expected!

---

## Step 4: Secure the System

**What you're doing:** Installing security tools to protect your development server.

### Step 4.1: Update System Packages

1. **Update system packages:**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```
   
   **What this does:** Downloads and installs the latest security updates. This may take a few minutes.

### Step 4.2: Install Security Tools

1. **Install security tools:**
   ```bash
   sudo apt install -y ufw fail2ban unattended-upgrades
   ```
   
   **What each tool does:**
   - **ufw:** Uncomplicated Firewall - controls what network traffic is allowed
   - **fail2ban:** Automatically blocks IPs that try to break in
   - **unattended-upgrades:** Automatically installs security updates

2. **Configure firewall:**
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow 22/tcp  # Allow SSH
   sudo ufw allow 3006/tcp  # Allow development web server
   sudo ufw enable
   ```
   
   **Breaking this down:**
   - `default deny incoming`: Block all incoming connections by default
   - `default allow outgoing`: Allow all outgoing connections (for updates, etc.)
   - `allow 22/tcp`: Allow SSH access
   - `allow 3006/tcp`: Allow development web server on port 3006
   - `enable`: Turn on the firewall

3. **Configure automatic security updates:**
   ```bash
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```
   
   - Select **"Yes"** to enable automatic updates
   - This keeps your system secure without manual intervention

---

## Step 5: Install Essential Development Tools

**What you're doing:** Installing all the tools and packages needed for development work.

### Step 5.1: Install Basic Development Tools

1. **Install essential packages:**
   ```bash
   sudo apt update
   sudo apt install -y \
     git \
     curl \
     wget \
     vim \
     nano \
     build-essential \
     software-properties-common \
     apt-transport-https \
     ca-certificates \
     gnupg \
     lsb-release \
     unzip \
     zip \
     htop \
     net-tools \
     tree
   ```
   
   **What each does:**
   - `git`: Version control system
   - `curl`, `wget`: Download files from the internet
   - `vim`, `nano`: Text editors
   - `build-essential`: Compiler tools (gcc, make, etc.)
   - `software-properties-common`: Manage software repositories
   - `apt-transport-https`, `ca-certificates`, `gnupg`: Secure package management
   - `lsb-release`: Linux distribution information
   - `unzip`, `zip`: Archive tools
   - `htop`: System monitor
   - `net-tools`: Network utilities (ifconfig, netstat, etc.)
   - `tree`: Directory tree viewer

### Step 5.2: Install Node.js and npm

**Why:** Next.js requires Node.js to run. We'll install the latest LTS version.

1. **Add NodeSource repository (for Node.js LTS):**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   ```
   
   **What this does:** Adds the official NodeSource repository for Node.js LTS versions.

2. **Install Node.js:**
   ```bash
   sudo apt install -y nodejs
   ```

3. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```
   
   **What to look for:** Should show version numbers (e.g., `v20.x.x` for Node.js, `10.x.x` for npm)

4. **Install global npm packages (useful for development):**
   ```bash
   sudo npm install -g \
     npm@latest \
     yarn \
     pm2 \
     nodemon \
     typescript \
     ts-node
   ```
   
   **What each does:**
   - `npm@latest`: Latest npm version
   - `yarn`: Alternative package manager
   - `pm2`: Process manager for Node.js apps
   - `nodemon`: Auto-restart Node.js apps on file changes
   - `typescript`, `ts-node`: TypeScript support

### Step 5.3: Install Docker and Docker Compose

**Why:** Docker allows you to run your application in containers, matching production environment.

1. **Install Docker from Ubuntu repositories:**
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   ```
   
   **What this does:** Installs Docker and Docker Compose from Ubuntu's repositories (simpler than Docker's official repo).

2. **Add your user to the docker group:**
   ```bash
   sudo usermod -aG docker $USER
   ```
   
   **What this does:** Allows you to run Docker commands without `sudo`.

3. **Apply group changes:**
   ```bash
   newgrp docker
   ```
   
   **What this does:** Refreshes your group membership without logging out. Or you can log out and log back in.

4. **Start and enable Docker:**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
   
   **What this does:**
   - `start`: Starts Docker right now
   - `enable`: Makes Docker start automatically on boot

5. **Verify Docker is working:**
   ```bash
   docker --version
   docker-compose --version
   docker run hello-world
   ```
   
   **What to look for:** Should show version numbers and "Hello from Docker!" message.

### Step 5.4: Install PostgreSQL Client Tools

**Why:** Useful for connecting to and managing databases during development.

1. **Install PostgreSQL client:**
   ```bash
   sudo apt install -y postgresql-client
   ```

2. **Verify installation:**
   ```bash
   psql --version
   ```

### Step 5.5: Install Additional Development Tools

1. **Install code editors and tools:**
   ```bash
   # Optional: Install VS Code Server (for remote development)
   curl -fsSL https://code-server.dev/install.sh | sh
   
   # Or install other useful tools
   sudo apt install -y \
     jq \
     bat \
     fd-find \
     ripgrep \
     fzf
   ```
   
   **What each does:**
   - `code-server`: VS Code in the browser (optional)
   - `jq`: JSON processor
   - `bat`: Better `cat` command
   - `fd-find`: Better `find` command
   - `ripgrep`: Better `grep` command
   - `fzf`: Fuzzy finder

---

## Step 6: Install Tailscale (Optional but Recommended)

**Why:** Allows you to SSH into the dev VM securely through Tailscale, even though it's on the DMZ.

1. **Install Tailscale:**
   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   ```

2. **Start Tailscale:**
   ```bash
   sudo tailscale up --ssh
   ```

3. **Authenticate:**
   - Visit the URL shown in the terminal
   - Use the same Tailscale account as Proxmox and production
   - The VM will now be accessible via Tailscale

4. **Note the Tailscale IP:**
   ```bash
   sudo tailscale status
   ```
   
   **What to look for:** Note the Tailscale IP (usually starts with `100.x.x.x`) - you'll use this to SSH into the dev VM.

---

## Step 7: Set Up Development Environment

### Step 7.1: Create Application Directory

1. **Create application directory:**
   ```bash
   sudo mkdir -p /opt/app
   sudo chown $USER:$USER /opt/app
   ```
   
   **What this does:** Creates a directory for your development code and makes you the owner.

2. **Verify permissions:**
   ```bash
   ls -ld /opt/app
   ```
   
   **What to look for:** Should show your username as the owner.

### Step 7.2: Clone Your Repository

1. **Navigate to app directory:**
   ```bash
   cd /opt/app
   ```

2. **Clone your repository:**
   ```bash
   git clone https://github.com/<username>/<repo>.git site
   ```
   
   **What to replace:**
   - `<username>`: Your GitHub username
   - `<repo>`: Your repository name
   
   **Example:** If your repo is at `https://github.com/johnsmith/personal-website-gen`, the command would be:
   ```bash
   git clone https://github.com/johnsmith/personal-website-gen.git site
   ```
   
   **If your repository is private:**
   - You may need to set up SSH keys or use a personal access token
   - See troubleshooting section below

3. **Verify the clone worked:**
   ```bash
   ls -la /opt/app/site
   ```
   
   **What to look for:** You should see files like `package.json`, `docker-compose.yml`, `src/`, etc.

### Step 7.3: Create Development Environment File

1. **Navigate to the site directory:**
   ```bash
   cd /opt/app/site
   ```

2. **Create development environment file:**
   ```bash
   cp config/env.example .env.local
   # Or if that doesn't exist:
   # cp .env.example .env.local
   ```

3. **Edit the environment file:**
   ```bash
   nano .env.local
   ```

4. **Configure development settings:**
   ```env
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:admin123@db:5432/personal_website
   NEXTAUTH_SECRET=dev-secret-key-change-in-production
   NEXTAUTH_URL=http://localhost:3006
   POSTGRES_DB=personal_website
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=admin123
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_URL=redis://redis:6379
   PORT=3006
   ```
   
   **What this does:** Sets up development-specific environment variables. These are different from production values.

5. **Save and secure the file:**
   ```bash
   # Save the file (Ctrl+O, Enter, Ctrl+X in nano)
   
   # Make it readable only by you
   chmod 600 .env.local
   ```

### Step 7.4: Install Project Dependencies

1. **Navigate to project directory:**
   ```bash
   cd /opt/app/site
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
   
   **What this does:** Installs all Node.js packages listed in `package.json`. This may take 5-10 minutes.

3. **Verify installation:**
   ```bash
   npm list --depth=0
   ```
   
   **What to look for:** Should show a list of installed packages without errors.

---

## Step 8: Start Development Environment

### Step 8.1: Start Services with Docker Compose

1. **Navigate to project directory:**
   ```bash
   cd /opt/app/site
   ```

2. **Start all development services:**
   ```bash
   docker-compose up -d
   ```
   
   **What this does:** Starts all services defined in `docker-compose.yml`:
   - Next.js development server (port 3006)
   - PostgreSQL database (port 5436)
   - Redis cache (port 6386)
   - Adminer (database management tool)
   
   **What `-d` does:** Runs in "detached" mode (background).

3. **Check that services are running:**
   ```bash
   docker-compose ps
   ```
   
   **What to look for:** All containers should show "Up" status.

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```
   
   **What this shows:** Real-time logs from all containers. Press `Ctrl + C` to exit.

### Step 8.2: Verify Development Server is Running

1. **Test the development server:**
   ```bash
   curl -I http://localhost:3006
   ```
   
   **What this does:** Tests if the web server is responding.
   
   **What to look for:** Should see `HTTP/1.1 200 OK` or similar success code.

2. **Test from your Admin PC (if accessible via Tailscale):**
   - Open a web browser
   - Go to: `http://192.168.20.10:3006` (development VM IP)
   - Or use Tailscale IP: `http://<dev-vm-tailscale-ip>:3006`
   - You should see your website homepage

3. **Test database connection:**
   ```bash
   docker-compose exec db psql -U postgres -d personal_website -c "SELECT version();"
   ```
   
   **What this does:** Tests if you can connect to the database.

---

## Step 9: Configure Git for Development

### Step 9.1: Configure Git User Information

1. **Set your Git username and email:**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

2. **Verify configuration:**
   ```bash
   git config --global --list
   ```

### Step 9.2: Set Up SSH Keys for GitHub (Optional)

**Why:** Allows you to push/pull from GitHub without entering credentials each time.

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "dev-vm@your-domain"
   ```
   
   - Press `Enter` to accept default location
   - Press `Enter` twice for no passphrase (or set one if you prefer)

2. **Display the public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   
   **What to do:** Copy the entire output (starts with `ssh-ed25519`)

3. **Add to GitHub:**
   - Go to https://github.com/settings/keys
   - Click **"New SSH key"**
   - **Title:** `Development VM`
   - **Key:** Paste the copied public key
   - Click **"Add SSH key"**

4. **Test SSH connection:**
   ```bash
   ssh -T git@github.com
   ```
   
   **What to look for:** Should see "Hi username! You've successfully authenticated..."

---

## Step 10: Set Up Auto-Startup (Optional)

**Why:** Automatically start development services when the VM boots.

### Step 10.1: Configure Proxmox VM Auto-Start

1. **In Proxmox web interface:**
   - Find your development VM (`ubuntu-dev-webserver`)
   - Right-click → **"More"** → **"Configure"** → **"Options"** tab
   - Find **"Start at boot"** option
   - **Enable** it (toggle to "Yes")
   - Click **"OK"** to save

### Step 10.2: Configure Docker Compose Auto-Start

1. **Create systemd service for Docker Compose:**
   ```bash
   sudo nano /etc/systemd/system/docker-compose-dev.service
   ```

2. **Add the following content:**
   ```ini
   [Unit]
   Description=Docker Compose Development Service
   Requires=docker.service
   After=docker.service network-online.target
   Wants=network-online.target

   [Service]
   Type=oneshot
   RemainAfterExit=yes
   WorkingDirectory=/opt/app/site
   ExecStart=/usr/bin/docker-compose up -d
   ExecStop=/usr/bin/docker-compose down
   TimeoutStartSec=300
   User=dev-admin
   Group=docker
   Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

   [Install]
   WantedBy=multi-user.target
   ```
   
   **Important:** Replace `dev-admin` with your actual username if different. To find your username:
   ```bash
   whoami
   ```

3. **Save and exit:**
   - Press `Ctrl + O`, then `Enter`
   - Press `Ctrl + X`

4. **Reload systemd and enable service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable docker-compose-dev.service
   ```

5. **Test the service:**
   ```bash
   sudo systemctl start docker-compose-dev.service
   sudo systemctl status docker-compose-dev.service
   ```

---

## Step 11: Verify Everything Works

### Step 11.1: Final Verification Checklist

1. **Network connectivity:**
   ```bash
   ping -c 3 8.8.8.8  # Should succeed
   ping -c 3 192.168.1.1  # Should fail (isolation test)
   ```

2. **Development server:**
   ```bash
   curl -I http://localhost:3006  # Should return 200 OK
   ```

3. **Database:**
   ```bash
   docker-compose exec db psql -U postgres -d personal_website -c "SELECT COUNT(*) FROM profiles;"
   ```

4. **Git:**
   ```bash
   git status
   git remote -v
   ```

5. **Docker:**
   ```bash
   docker ps
   docker-compose ps
   ```

### Step 11.2: Access from Admin PC

**Via Tailscale (Recommended):**
```bash
# SSH into dev VM
ssh dev-admin@<dev-vm-tailscale-ip>

# Access web interface
http://<dev-vm-tailscale-ip>:3006
```

**Via DMZ IP (if on same network):**
```bash
# SSH into dev VM
ssh dev-admin@192.168.20.10

# Access web interface
http://192.168.20.10:3006
```

---

## Troubleshooting

### Issue: Can't connect to internet

**Solution:**
1. Check NAT is configured on Proxmox (Step 4 of Proxmox Master Plan)
2. Verify gateway: `ip route show` (should show `192.168.20.1`)
3. Test DNS: `nslookup google.com`

### Issue: Can't clone repository

**Solution:**
1. If private repo, set up SSH keys (Step 9.2)
2. Or use HTTPS with personal access token:
   ```bash
   git clone https://<token>@github.com/username/repo.git site
   ```

### Issue: Docker permission denied

**Solution:**
1. Verify you're in docker group: `groups`
2. If not, add yourself: `sudo usermod -aG docker $USER`
3. Log out and log back in, or run: `newgrp docker`

### Issue: Port 3006 already in use

**Solution:**
1. Find what's using it: `sudo netstat -tulpn | grep 3006`
2. Stop the conflicting service or change port in `.env.local`

### Issue: Database connection fails

**Solution:**
1. Check database container is running: `docker-compose ps db`
2. Verify DATABASE_URL in `.env.local` matches docker-compose.yml
3. Check database logs: `docker-compose logs db`

### Issue: npm install fails

**Solution:**
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules and package-lock.json: `rm -rf node_modules package-lock.json`
3. Try again: `npm install`

---

## Quick Reference

### Common Commands

```bash
# Start development environment
cd /opt/app/site
docker-compose up -d

# Stop development environment
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Access database
docker-compose exec db psql -U postgres -d personal_website

# Pull latest code
cd /opt/app/site
git pull origin main

# Rebuild after code changes
docker-compose up -d --build
```

### File Locations

- **Project directory:** `/opt/app/site`
- **Environment file:** `/opt/app/site/.env.local`
- **Docker compose:** `/opt/app/site/docker-compose.yml`
- **Git config:** `~/.gitconfig`
- **SSH keys:** `~/.ssh/`

---

## Next Steps

After setting up your development VM:

1. ✅ **Push production changes to GitHub** - See `docs/PUSH_PRODUCTION_TO_GITHUB.md`
2. ✅ **Pull changes on dev VM** - `git pull origin main`
3. ✅ **Continue development** - Make changes, test, commit, push
4. ✅ **Deploy to production** - When ready, merge to production branch

---

## Summary

You now have a fully configured development VM that:
- ✅ Runs on the same DMZ network as production (192.168.20.10)
- ✅ Has all necessary development tools installed
- ✅ Can run your Next.js application in Docker
- ✅ Is accessible via Tailscale for secure remote access
- ✅ Can sync code with GitHub for collaboration
- ✅ Can run simultaneously with production VM without conflicts

**Development VM:** 192.168.20.10 (port 3006)  
**Production VM:** 192.168.20.20 (port 3000)  
**Both on:** vmbr20 (DMZ network - VLAN 20)




