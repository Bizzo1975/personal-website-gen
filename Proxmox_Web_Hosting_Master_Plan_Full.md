# Proxmox Web Hosting Master Plan (Option A)

**Created for www.willworkforlunch.com / Infrastructure Deployment Reference**

---

## Deployment Guide

This comprehensive guide provides the full step-by-step configuration for hosting a Next.js + TypeScript website on an Ubuntu VM within a Proxmox VE environment. The setup uses a Netgear GS308EP managed switch and a Netgear Nighthawk CAX30 router, ensuring network isolation and secure remote management through Tailscale and Cloudflare Tunnel.

**Note for Beginners:** This guide is written for someone with high school education and no coding experience. Each step includes detailed explanations of what you're doing and why. If you encounter any errors, read the error message carefully and refer to the troubleshooting sections throughout this guide.

---

## Step 0: IP and VLAN Plan

Before beginning configuration, define the IP and VLAN structure.

**What is a VLAN?** A VLAN (Virtual Local Area Network) is like creating separate "virtual networks" on the same physical switch. This allows you to isolate different parts of your network for security. Think of it like having separate rooms in a building - devices in one VLAN can't directly talk to devices in another VLAN.

**What is an IP address?** An IP address is like a street address for your computer on the network. The format `192.168.20.10/24` means:
- `192.168.20.10` is the specific address
- `/24` means the first 24 bits are the network address, allowing 254 devices (192.168.20.1 to 192.168.20.254)

### Network Overview

- **LAN (VLAN 1):** 192.168.1.0/24 — Default network managed by the CAX30 router  
  - This is your normal home/office network where your admin PC and other regular devices connect
  - Devices on this network can access the internet normally
  
- **Management (VLAN 10):** 192.168.10.0/24 — For Proxmox management  
  - This network is ONLY for managing the Proxmox server itself
  - Isolated from other networks for security
  - Only accessible through Tailscale (secure VPN)
  
- **DMZ (VLAN 20):** 192.168.20.0/24 — For the Ubuntu web server and public traffic  
  - DMZ stands for "Demilitarized Zone" - it's a separate network for public-facing services
  - The web server lives here, isolated from your private networks
  - Even if compromised, it can't access your management or private networks

### Assigned IPs

Write these down - you'll need them throughout the setup:

- **Proxmox Management IP:** 192.168.10.10  
  - This is the address you'll use to access Proxmox's web interface
  
- **Proxmox NAT Gateway:** 192.168.20.1  
  - This allows the DMZ network to access the internet
  - Acts as a router for VLAN 20
  
- **Ubuntu Web Server:** 192.168.20.10  
  - This is where your website will run
  - Accessible through Cloudflare Tunnel to the public internet

**Important:** Your admin PC stays on VLAN 1 with normal internet access. You'll connect to everything else through Tailscale (secure VPN).

---

## Step 1: Hardware and Cable Connections

**What you're doing:** Physically connecting your network equipment in the correct order. This ensures data can flow properly between devices.

**Equipment needed:**
- Netgear CAX30 router (your main internet gateway)
- Netgear GS308EP managed switch (creates the VLANs)
- Proxmox server (the computer running Proxmox)
- Your Admin PC (the computer you'll use to manage everything)
- Ethernet cables

**Step-by-step connections:**

1. **Connect the CAX30 router to the switch:**
   - Take one Ethernet cable
   - Connect one end to any LAN port on the CAX30 router
   - Connect the other end to **GS308EP Port 1**
   - This provides internet access to the switch

2. **Connect the Proxmox server to the switch:**
   - Take another Ethernet cable
   - Connect one end to the network port on your Proxmox server
   - Connect the other end to **GS308EP Port 2**
   - This is the main connection that will carry all VLANs (tagged traffic)

3. **Connect your Admin PC to the switch:**
   - Take another Ethernet cable
   - Connect one end to your Admin PC's network port
   - Connect the other end to **GS308EP Port 3**
   - This keeps your PC on the normal LAN network

4. **Optional - Connect a DMZ test device:**
   - If you want to test the DMZ network, connect a device to **GS308EP Port 4**
   - This device will be on the DMZ network (VLAN 20) for testing

5. **Use remaining ports for other devices:**
   - **Ports 5-8** are for regular LAN devices (printers, NAS, etc.)
   - These will all be on VLAN 1 (normal network)

**Verification:** After connecting, check that:
- All devices show link lights (usually green LEDs on the switch)
- Your Admin PC can access the internet
- You can see the GS308EP in your network (try accessing it via web browser at `http://192.168.1.1` or check your router's connected devices list)

---

## Step 2: Configure VLANs on the GS308EP

**What you're doing:** Configuring the switch to create separate virtual networks (VLANs). This isolates your management network and DMZ from your regular network for security.

**Understanding VLAN terms:**
- **Tagged:** The switch adds a "tag" (like a label) to network traffic so it knows which VLAN it belongs to. Used when multiple VLANs share one physical cable.
- **Untagged:** Traffic without a tag - the switch assumes it belongs to the default VLAN for that port.
- **PVID (Port VLAN ID):** The default VLAN for untagged traffic on that port.

### Step 2.1: Access the Switch Web Interface

1. **Find the switch's IP address:**
   - Check your router's admin page (usually at `http://192.168.1.1` or `http://routerlogin.net`)
   - Look for "Connected Devices" or "DHCP Client List"
   - Find "GS308EP" or "Netgear Switch" and note its IP address (usually something like `192.168.1.2`)

2. **Open web browser and connect:**
   - Open any web browser on your Admin PC
   - Type the switch's IP address in the address bar (e.g., `http://192.168.1.2`)
   - Press Enter

3. **Log in:**
   - Default username is usually `admin`
   - Default password is usually `password` or `admin`
   - If these don't work, check the switch's manual or reset it to factory defaults

### Step 2.2: Create VLANs

1. **Navigate to VLAN settings:**
   - Click on **VLAN** in the menu
   - Click on **802.1Q** (this is the VLAN standard we're using)
   - Click on **Advanced** (or **VLAN Configuration**)

2. **Create VLAN 10 (Management):**
   - Click **Add** or **Create VLAN**
   - Enter **VLAN ID:** `10`
   - Enter **VLAN Name:** `MGMT` (short for Management)
   - Click **Apply** or **Save**

3. **Create VLAN 20 (DMZ):**
   - Click **Add** or **Create VLAN** again
   - Enter **VLAN ID:** `20`
   - Enter **VLAN Name:** `DMZ`
   - Click **Apply** or **Save**

**Note:** VLAN 1 (the default LAN) already exists - you don't need to create it.

### Step 2.3: Configure VLAN Membership

**What this means:** You're telling each port which VLANs it can access. "Tagged" means the port can handle multiple VLANs (with tags), "Untagged" means it only handles one VLAN (without tags).

1. **Navigate to VLAN Membership:**
   - Still in the VLAN settings, find **VLAN Membership** or **Port VLAN Assignment**

2. **Configure VLAN 1 (LAN):**
   - Find VLAN 1 in the list
   - Set **Port 1:** Untagged (this connects to your router)
   - Set **Port 2:** Tagged (this carries multiple VLANs to Proxmox)
   - Set **Port 3:** Untagged (your Admin PC)
   - Set **Ports 5-8:** Untagged (regular devices)
   - Set **Port 4:** Leave as is (we'll configure this separately)

3. **Configure VLAN 10 (Management):**
   - Find VLAN 10 in the list
   - Set **Port 2:** Tagged (only Proxmox needs management access)
   - All other ports: Not a member (leave unchecked or set to "Not Member")

4. **Configure VLAN 20 (DMZ):**
   - Find VLAN 20 in the list
   - Set **Port 2:** Tagged (Proxmox needs DMZ access)
   - Set **Port 4:** Untagged (DMZ test device)
   - All other ports: Not a member

### Step 2.4: Set PVID (Port VLAN ID) Values

**What PVID does:** When a device sends untagged traffic (normal traffic without VLAN tags), the switch assigns it to the VLAN specified by the PVID.

1. **Navigate to PVID settings:**
   - Find **PVID** or **Port VLAN ID** settings (usually in the same VLAN section)

2. **Set PVID for each port:**
   - **Port 1:** `1` (connects to router - normal LAN)
   - **Port 2:** `1` (default for Proxmox - will use tags for other VLANs)
   - **Port 3:** `1` (your Admin PC - normal LAN)
   - **Port 4:** `20` (DMZ test device - goes to DMZ network)
   - **Ports 5-8:** `1` (normal LAN devices)

### Step 2.5: Save and Apply Changes

1. **Review your settings:**
   - Double-check all VLAN memberships and PVIDs are correct
   - Make sure you haven't accidentally locked yourself out

2. **Save changes:**
   - Click **Save** or **Apply** button
   - The switch may take 10-30 seconds to apply changes
   - You might lose connection briefly - this is normal

3. **Verify:**
   - After saving, your Admin PC should still have internet access
   - If you lost connection, wait 30 seconds and try refreshing

**Troubleshooting:**
- If you can't access the switch after changes, you may have made an error. Reset the switch to factory defaults (usually a small reset button on the back) and try again.
- If your Admin PC loses internet, check that Port 1 and Port 3 are still set to VLAN 1 untagged.

---

## Step 3: Configure Proxmox Network Bridges

**What you're doing:** Configuring Proxmox to understand and use the VLANs you created on the switch. A "bridge" in Proxmox is like a virtual network switch that connects VMs to your physical network.

**What is a network bridge?** Think of it like a translator - it takes the tagged VLAN traffic from your physical switch and makes it available to virtual machines. Each bridge (vmbr1, vmbr10, vmbr20) corresponds to a VLAN.

### Step 3.1: Access Proxmox via SSH

**Option A: Using Tailscale (if already installed):**
1. Make sure Tailscale is running on both your Admin PC and Proxmox server
2. Find Proxmox's Tailscale IP address (look in Tailscale admin console)
3. Open a terminal/command prompt and type: `ssh root@<proxmox-tailscale-ip>`

**Option B: Direct connection (first time setup):**
1. Connect a monitor and keyboard directly to the Proxmox server
2. Or use a KVM/IPMI if available
3. Log in with your root credentials

### Step 3.2: Edit the Network Configuration File

1. **Open the network configuration file:**
```bash
   nano /etc/network/interfaces
   ```
   
   **What this does:** Opens the file in a text editor called "nano". This file controls all network settings on Proxmox.

2. **Backup the original file first (IMPORTANT):**
   ```bash
   cp /etc/network/interfaces /etc/network/interfaces.backup
   ```
   
   **Why:** This creates a backup in case something goes wrong. You can restore it later if needed.

3. **Replace the entire contents** with the configuration below. Here's what each section means:

```bash
# Loopback interface - internal network communication
auto lo
iface lo inet loopback
# This is always present - it's for the computer to talk to itself

# Physical network interface (your actual network card)
auto eno1
iface eno1 inet manual
# "eno1" is the name of your network card - yours might be "enp2s0" or "eth0"
# Check with: ip link show
# Replace "eno1" with your actual network card name if different

# Bridge for VLAN 1 (LAN - normal internet access)
auto vmbr1
iface vmbr1 inet dhcp
    bridge-ports eno1.1
    bridge-stp off
    bridge-fd 0
# This bridge gets internet from your router via DHCP (automatic IP assignment)
# "eno1.1" means "use VLAN 1 on the eno1 network card"

# Bridge for VLAN 10 (Management network)
auto vmbr10
iface vmbr10 inet static
    address 192.168.10.10/24
    bridge-ports eno1.10
    bridge-stp off
    bridge-fd 0
# This bridge uses a fixed IP address (192.168.10.10)
# "eno1.10" means "use VLAN 10 on the eno1 network card"
# This is how you'll access Proxmox web interface

# Bridge for VLAN 20 (DMZ network)
auto vmbr20
iface vmbr20 inet static
    address 192.168.20.1/24
    bridge-ports eno1.20
    bridge-stp off
    bridge-fd 0
# This bridge uses a fixed IP address (192.168.20.1)
# "eno1.20" means "use VLAN 20 on the eno1 network card"
# This will be the gateway for your web server VM
```

**Important:** Before saving, check your actual network card name:
```bash
ip link show
```
Look for something like `eno1`, `enp2s0`, `eth0`, etc. Replace `eno1` in the configuration above with your actual network card name.

4. **Save the file:**
   - Press `Ctrl + O` (that's the letter O, not zero)
   - Press `Enter` to confirm the filename
   - Press `Ctrl + X` to exit nano

### Step 3.3: Apply Network Changes

**WARNING:** This will temporarily disconnect your network connection. Make sure you're connected via console/monitor, not SSH over the network you're about to change!

1. **Reload network configuration:**
```bash
ifreload -a
   ```
   
   **What this does:** Tells the system to reload all network interfaces with the new configuration. Your connection might drop briefly.

2. **Verify the configuration worked:**
   ```bash
ip a
```
   
   **What this shows:** All your network interfaces and their IP addresses. You should see:
   - `vmbr1` with an IP address from your router (something like 192.168.1.x)
   - `vmbr10` with IP address `192.168.10.10`
   - `vmbr20` with IP address `192.168.20.1`

3. **Test connectivity:**
   ```bash
   ping -c 3 8.8.8.8
   ```
   
   **What this does:** Tests internet connectivity by pinging Google's DNS server. You should see 3 successful replies.

**Troubleshooting:**
- If `ifreload -a` fails, check your syntax in the file. Common mistakes: missing spaces, typos in interface names.
- If you lose connection completely, you'll need physical access to the server to restore the backup: `cp /etc/network/interfaces.backup /etc/network/interfaces` then `ifreload -a`
- If vmbr10 or vmbr20 don't show up, check that your switch VLAN configuration is correct (Step 2).

---

## Step 4: Enable NAT for DMZ Internet Access

**What you're doing:** Configuring Proxmox to act as a router for the DMZ network (VLAN 20). This allows your web server VM to access the internet while keeping it isolated from your private networks.

**What is NAT?** Network Address Translation allows multiple devices to share one internet connection. The DMZ network (192.168.20.x) will use Proxmox (192.168.20.1) as its gateway to the internet.

### Step 4.1: Enable IP Forwarding

IP forwarding allows Proxmox to forward network traffic between different networks (like a router does).

1. **Enable IP forwarding permanently:**
```bash
echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/98-ipforward.conf
   ```
   
   **What this does:** Creates a configuration file that tells the system to allow forwarding packets between networks. The `tee` command writes to the file.

2. **Apply the setting immediately:**
   ```bash
sudo sysctl --system
```

   **What this does:** Reloads all system configuration files, applying the IP forwarding setting right away.

3. **Verify it's enabled:**
   ```bash
   cat /proc/sys/net/ipv4/ip_forward
   ```
   
   **What this shows:** Should display `1` if forwarding is enabled. If it shows `0`, something went wrong.

### Step 4.2: Configure NAT and Security Rules

**What is iptables?** It's a firewall tool that controls what network traffic is allowed. We're setting up rules to:
1. Allow DMZ devices to access the internet (NAT)
2. Block DMZ from accessing your private networks (security)

1. **Add NAT rule (allows DMZ to access internet):**
```bash
iptables -t nat -A POSTROUTING -s 192.168.20.0/24 -o vmbr1 -j MASQUERADE
   ```
   
   **Breaking this down:**
   - `-t nat`: Work with NAT (Network Address Translation) table
   - `-A POSTROUTING`: Add a rule that applies after routing decisions
   - `-s 192.168.20.0/24`: For traffic coming from the DMZ network
   - `-o vmbr1`: Going out through the LAN bridge (to internet)
   - `-j MASQUERADE`: Hide the DMZ IPs behind Proxmox's IP (like a router does)

2. **Block DMZ from accessing LAN (VLAN 1):**
   ```bash
iptables -A FORWARD -i vmbr20 -o vmbr1 -d 192.168.1.0/24 -j DROP
   ```
   
   **Breaking this down:**
   - `-A FORWARD`: Add a rule for forwarded traffic
   - `-i vmbr20`: Traffic coming from DMZ network
   - `-o vmbr1`: Trying to go to LAN network
   - `-d 192.168.1.0/24`: Destination is LAN network
   - `-j DROP`: Block it completely

3. **Block DMZ from accessing Management network (VLAN 10):**
   ```bash
iptables -A FORWARD -i vmbr20 -o vmbr10 -d 192.168.10.0/24 -j DROP
   ```
   
   **Breaking this down:** Same as above, but blocking access to the management network (192.168.10.x)

4. **Allow return traffic (established connections):**
   ```bash
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
```

   **Breaking this down:**
   - `-m state`: Match connection state
   - `--state ESTABLISHED,RELATED`: Traffic that's part of an existing connection
   - `-j ACCEPT`: Allow it through
   - **Why:** This allows responses to come back (like when the web server requests a webpage, the response needs to come back)

### Step 4.3: Make Rules Persistent

**Why:** By default, iptables rules are lost when the system reboots. We need to save them so they persist.

1. **Install iptables-persistent:**
```bash
   sudo apt update
sudo apt install iptables-persistent -y
```
   
   **What this does:** Installs a package that automatically saves and restores iptables rules on boot.

2. **Save current rules:**
   ```bash
   sudo netfilter-persistent save
   ```
   
   **What this does:** Saves your current iptables rules to disk so they'll be restored on reboot.

3. **Verify rules are saved:**
   ```bash
   sudo iptables -L -v -n
   sudo iptables -t nat -L -v -n
   ```
   
   **What this shows:** Lists all your current firewall rules. You should see your rules listed.

**Troubleshooting:**
- If NAT doesn't work, check that IP forwarding is enabled: `cat /proc/sys/net/ipv4/ip_forward` (should show `1`)
- Test connectivity from DMZ later when you create the VM - it should be able to ping 8.8.8.8 but NOT 192.168.1.1 or 192.168.10.10

---

## Step 5: Secure Proxmox Access with Tailscale

**What you're doing:** Installing Tailscale, which creates a secure VPN (Virtual Private Network). This allows you to access Proxmox securely from anywhere without exposing it to the public internet.

**What is Tailscale?** It's like a private internet that only your devices can access. It uses encryption and authentication to create secure connections between your devices, even if they're on different networks.

### Step 5.1: Install Tailscale on Proxmox

1. **Download and run the Tailscale installer:**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
   ```
   
   **What this does:**
   - `curl`: Downloads the installer script from Tailscale's website
   - `-fsSL`: Flags that make curl silent and follow redirects
   - `| sh`: Pipes the downloaded script directly to the shell to execute it
   
   **What you'll see:** The script will download and install Tailscale. It may ask for your password (sudo access).

2. **Start Tailscale and connect to your account:**
   ```bash
sudo tailscale up --ssh
```

   **What this does:**
   - `tailscale up`: Starts Tailscale and connects to the Tailscale network
   - `--ssh`: Enables SSH access through Tailscale
   
   **What you'll see:** A message with a URL. You need to visit this URL in a web browser to authenticate.

3. **Authenticate:**
   - Copy the URL shown in the terminal
   - Open it in a web browser (on any device)
   - Sign in with your Google, Microsoft, or GitHub account (or create a Tailscale account)
   - Click "Connect" to authorize this device

4. **Verify Tailscale is running:**
   ```bash
   sudo tailscale status
   ```
   
   **What this shows:** Lists all devices in your Tailscale network and their IP addresses. You should see your Proxmox server listed.

5. **Note the Tailscale IP address:**
   - Look for your Proxmox server in the status output
   - Write down its Tailscale IP (usually starts with `100.x.x.x`)
   - You'll use this to access Proxmox web interface

### Step 5.2: Install Tailscale on Your Admin PC

**For Windows:**
1. Go to https://tailscale.com/download
2. Download and install Tailscale for Windows
3. Open Tailscale from the Start menu
4. Click "Log in" and use the same account you used on Proxmox
5. The Admin PC will now appear in your Tailscale network

**For Mac:**
1. Go to https://tailscale.com/download
2. Download and install Tailscale for macOS
3. Open Tailscale from Applications
4. Click "Log in" and use the same account
5. The Admin PC will now appear in your Tailscale network

**For Linux:**
```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
Then authenticate the same way as Proxmox.

### Step 5.3: Access Proxmox Web Interface

1. **Find Proxmox's Tailscale IP:**
   - On your Admin PC, open Tailscale
   - Or run `tailscale status` in terminal/command prompt
   - Find the Proxmox server and note its IP (e.g., `100.64.1.2`)

2. **Open Proxmox web interface:**
   - Open a web browser on your Admin PC
   - Go to: `https://<proxmox-tailscale-ip>:8006`
   - For example: `https://100.64.1.2:8006`
   
   **Important:** Use `https://` (not `http://`) and include `:8006` port number

3. **Accept the security warning (first time only):**
   - Your browser may show a security warning because the certificate is self-signed
   - Click "Advanced" then "Proceed" or "Accept the risk"
   - This is normal for self-hosted services

4. **Log in:**
   - Username: `root`
   - Password: Your Proxmox root password
   - Realm: `Linux PAM standard authentication`

### Step 5.4: Enable Two-Factor Authentication (2FA)

**Why:** 2FA adds an extra layer of security. Even if someone gets your password, they need your phone to log in.

1. **In Proxmox web interface:**
   - Click on **Datacenter** in the left sidebar (top item)
   - Click on **Permissions** tab
   - Click on **Two Factor** submenu

2. **Enable 2FA:**
   - Check the box for **"Enable Two Factor Authentication"**
   - Choose your preferred method:
     - **TOTP (Time-based One-Time Password):** Use an app like Google Authenticator
     - **Yubico:** If you have a YubiKey hardware token

3. **Set up TOTP (if chosen):**
   - Click **"Add TOTP"**
   - Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
   - Enter the 6-digit code from your app to confirm
   - Save the backup codes in a safe place

4. **Test 2FA:**
   - Log out of Proxmox
   - Log back in - you should now be prompted for the 6-digit code from your app

**Troubleshooting:**
- If you can't access Proxmox via Tailscale, check that both devices are logged into the same Tailscale account
- Verify Tailscale is running: `sudo systemctl status tailscaled`
- Check firewall isn't blocking: `sudo ufw status` (should allow Tailscale)
- If 2FA setup fails, make sure your system time is correct (TOTP is time-sensitive)

---

## Step 6: Create and Configure the Ubuntu Server VM

**What you're doing:** Creating a virtual machine (VM) that will run your website. This VM will be isolated on the DMZ network for security.

### Step 6.1: Create the VM in Proxmox

1. **Open Proxmox web interface:**
   - Access via Tailscale: `https://<proxmox-tailscale-ip>:8006`

2. **Create new VM:**
   - Click **"Create VM"** button (top right) or right-click on your Proxmox node
   - This opens the VM creation wizard

3. **General tab:**
   - **VM ID:** Auto-generated (e.g., 100) - just note it down
   - **Name:** `ubuntu-webserver` (or any name you prefer)
   - **Resource Pool:** Leave default
   - Click **Next**

4. **OS tab:**
   - **Use CD/DVD disc image file (iso):** Select this
   - **Storage:** Choose where to store the ISO (usually `local`)
   - **ISO image:** Click the dropdown and select **Ubuntu Server 24.04 LTS**
     - If not listed, click **"Download"** and search for "Ubuntu Server 24.04"
     - Download the ISO (this may take a few minutes)
   - Click **Next**

5. **System tab:**
   - **Graphic card:** Default (std)
   - **Machine:** Default (i440fx)
   - **BIOS:** Default (SeaBIOS)
   - **SCSI controller:** Default (VirtIO SCSI single)
   - **Qemu agent:** **CHECK THIS BOX** (allows better VM management)
   - Click **Next**

6. **Hardware tab:**
   - **Hard disk:**
     - **Bus/Device:** VirtIO Block
     - **Storage:** Choose your storage (usually `local-lvm`)
     - **Disk size:** `32` GB (minimum) - adjust based on your needs
   - **CPU:**
     - **Sockets:** `1`
     - **Cores:** `2` (minimum) - more is better if available
   - **Memory:**
     - **Memory:** `2048` MB (2 GB minimum) - 4 GB recommended
   - Click **Next**

7. **Network tab (CRITICAL - This is where you assign the DMZ network):**
   - **Bridge:** Select **vmbr20** (this is the DMZ bridge!)
   - **Model:** VirtIO (paravirtualized) - fastest option
   - **MAC address:** Auto-generated (leave as is)
   - **VLAN tag:** Leave empty (VLAN is handled by the bridge)
   - **Firewall:** Uncheck this (we're using network isolation instead)
   - Click **Next**

8. **Confirm:**
   - Review all settings
   - Make absolutely sure **vmbr20** is selected for network!
   - Click **Finish**

### Step 6.2: Install Ubuntu Server

1. **Start the VM:**
   - Find your new VM in the left sidebar
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
     - **Server name:** `webserver` (or any name)
     - **Username:** `ubuntu` (or your preferred username)
     - **Password:** Choose a strong password (write it down securely!)
   - **SSH Setup:** **CHECK "Install OpenSSH server"** (important!)
   - **Snaps:** Leave defaults or skip
   - **Installation will begin** - this takes 5-15 minutes

4. **After installation completes:**
   - It will prompt to reboot
   - The VM will restart
   - You'll see the login prompt

### Step 6.3: Configure Static IP Address

**Why:** We need a fixed IP address (192.168.20.10) so we can always find the web server and configure it properly.

1. **Log in to the VM:**
   - Use the username and password you set during installation

2. **Edit network configuration:**
   ```bash
   sudo nano /etc/netplan/01-netcfg.yaml
   ```
   
   **What this does:** Opens the network configuration file in nano editor.

3. **Replace the entire file contents with:**
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
   - `ens18`: Your network interface name (might be different - check with `ip link show`)
   - `dhcp4: no`: Don't use automatic IP assignment
   - `addresses: [192.168.20.10/24]`: Use this fixed IP address
   - `via: 192.168.20.1`: Use Proxmox as the gateway (router)
   - `nameservers`: DNS servers for internet lookups (Cloudflare and Google)

   **Important:** If your network interface is NOT `ens18`, replace it with the correct name. Check with:
   ```bash
   ip link show
   ```
   Look for something like `ens18`, `eth0`, `enp0s3`, etc.

4. **Save and exit:**
   - Press `Ctrl + O`, then `Enter`
   - Press `Ctrl + X`

5. **Apply the network configuration:**
```bash
sudo netplan apply
```

   **What this does:** Applies the new network settings. Your connection might drop briefly.

6. **Verify it worked:**
   ```bash
   ip addr show
   ```
   
   **What to look for:** You should see `192.168.20.10` listed under your network interface.

7. **Test internet connectivity:**
   ```bash
   ping -c 3 8.8.8.8
   ```
   
   **What this does:** Tests if the VM can reach the internet. You should see 3 successful replies.
   
   **Also test isolation (should FAIL):**
   ```bash
   ping -c 3 192.168.1.1
   ping -c 3 192.168.10.10
   ```
   
   **What this does:** Tests that the DMZ is properly isolated. These should fail (timeout) - this is correct and expected!

### Step 6.4: Secure the System

**What you're doing:** Installing security tools to protect your server from attacks.

1. **Update system packages:**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```
   
   **What this does:** Downloads and installs the latest security updates. This may take a few minutes.

2. **Install security tools:**
```bash
sudo apt install -y ufw fail2ban unattended-upgrades
   ```
   
   **What each tool does:**
   - **ufw:** Uncomplicated Firewall - controls what network traffic is allowed
   - **fail2ban:** Automatically blocks IPs that try to break in
   - **unattended-upgrades:** Automatically installs security updates

3. **Configure firewall:**
   ```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
```

   **Breaking this down:**
   - `default deny incoming`: Block all incoming connections by default
   - `default allow outgoing`: Allow all outgoing connections (for updates, etc.)
   - `enable`: Turn on the firewall
   
   **Note:** We'll add specific rules later when we set up services.

4. **Configure automatic security updates:**
   ```bash
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```
   
   - Select **"Yes"** to enable automatic updates
   - This keeps your system secure without manual intervention

### Step 6.5: Install Tailscale (Optional but Recommended)

**Why:** Allows you to SSH into the VM securely through Tailscale, even though it's on the DMZ.

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
   - Use the same Tailscale account as Proxmox
   - The VM will now be accessible via Tailscale

**Troubleshooting:**
- If network interface name is wrong, check with `ip link show` and update the netplan file
- If internet doesn't work, verify NAT is configured correctly on Proxmox (Step 4)
- If you can't ping 8.8.8.8, check that Proxmox's iptables rules are correct
- If you CAN ping 192.168.1.1 or 192.168.10.10, that's a security issue - check iptables rules on Proxmox

---

## Step 7: Deploy Next.js Website with Docker

**What you're doing:** Installing Docker (a container platform) and deploying your website. Docker packages your application and all its dependencies together, making deployment easier and more reliable.

**What is Docker?** Think of it like shipping containers for software. Your application, database, web server - everything is packaged in "containers" that run the same way everywhere.

### Step 7.1: Install Docker and Required Tools

1. **Install Docker and related tools:**
```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose git curl
   ```
   
   **What each does:**
   - `docker.io`: The Docker container platform (from Ubuntu repositories)
   - `docker-compose`: Standalone Docker Compose tool (v1) for managing multiple containers
   - `git`: Version control tool (to download your code)
   - `curl`: Tool to download files and test web services
   
   **Note:** If you prefer Docker Compose v2 (plugin), you'll need to install Docker from Docker's official repository instead:
   ```bash
   # Alternative: Install Docker from official repository (includes compose plugin)
   sudo apt update
   sudo apt install -y ca-certificates curl gnupg
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
   sudo apt update
   sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git curl
   ```
   
   **For simplicity, we'll use the Ubuntu repository version (`docker.io` and `docker-compose`) which works perfectly fine.**

2. **Add your user to the docker group (so you don't need sudo for docker commands):**
```bash
   sudo usermod -aG docker $USER
```

   **What this does:** Adds your user account to the "docker" group, giving you permission to run Docker commands.

3. **Apply the group change:**
```bash
   newgrp docker
   ```
   
   **What this does:** Refreshes your group membership without logging out. Or you can just log out and log back in.

4. **Verify Docker is working:**
   ```bash
   docker --version
   docker-compose --version
   ```
   
   **What to look for:** Both commands should show version numbers. If you see "command not found", something went wrong with installation.
   
   **Note:** If you installed from Docker's official repository, use `docker compose version` (with space). If you installed from Ubuntu repos, use `docker-compose --version` (with hyphen).

5. **Start Docker service:**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker
   ```
   
   **What this does:**
   - `start`: Starts Docker right now
   - `enable`: Makes Docker start automatically on boot

6. **Test Docker with a simple container:**
   ```bash
   docker run hello-world
   ```
   
   **What this does:** Downloads and runs a test container. You should see "Hello from Docker!" message. This confirms Docker is working correctly.

### Step 7.2: Prepare Directory Structure

1. **Create application directory:**
   ```bash
   sudo mkdir -p /opt/app
   ```
   
   **What this does:** Creates a directory at `/opt/app` where we'll store your website. The `/opt` directory is for optional/third-party software.

2. **Change ownership to your user:**
   ```bash
   sudo chown $USER:$USER /opt/app
   ```
   
   **What this does:** Makes you the owner of the directory so you can create/modify files without sudo.

3. **Verify permissions:**
   ```bash
   ls -ld /opt/app
   ```
   
   **What to look for:** Should show your username as the owner.

### Step 7.3: Clone Your Website Repository

**What you're doing:** Downloading your website's source code from GitHub (or wherever it's stored).

1. **Navigate to the app directory:**
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
   
   **Example:** If your repo is at `https://github.com/johnsmith/my-website`, the command would be:
```bash
   git clone https://github.com/johnsmith/my-website.git site
   ```
   
   **What this does:** Downloads your entire website codebase into `/opt/app/site`.

3. **If your repository is private (requires authentication):**
   - You may need to set up SSH keys or use a personal access token
   - For now, if it asks for credentials, you'll need to:
     - Create a GitHub Personal Access Token
     - Use it as the password when git prompts

4. **Verify the clone worked:**
   ```bash
   ls -la /opt/app/site
   ```
   
   **What to look for:** You should see files like `package.json`, `docker-compose.yml`, `src/`, etc.

### Step 7.4: Create Production Environment File

**What you're doing:** Creating a configuration file with production settings (database passwords, API keys, etc.).

1. **Navigate to the site directory:**
   ```bash
   cd /opt/app/site
   ```

2. **Create production environment file:**
   ```bash
   nano .env.production
   ```
   
   **What this does:** Creates a new file for production environment variables.

3. **Add your production configuration:**
   - Copy the template from your repository (if you have `config/env.production.template`)
   - Or create it based on your development `.env.local` file
   - **IMPORTANT:** Update all values for production:
     - Database passwords
     - API keys
     - URLs (use production domain)
     - Email settings
   
   **Example structure (your actual values will be different):**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres:YOUR_STRONG_PASSWORD@db:5432/personal_website
   NEXTAUTH_SECRET=YOUR_RANDOM_SECRET_HERE
   NEXTAUTH_URL=https://www.willworkforlunch.com
   POSTGRES_DB=personal_website
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
   REDIS_PASSWORD=YOUR_REDIS_PASSWORD
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-email-password
   ADMIN_EMAIL=admin@willworkforlunch.com
   DOMAIN_NAME=www.willworkforlunch.com
   ```

4. **Save and secure the file:**
   ```bash
   # Save the file (Ctrl+O, Enter, Ctrl+X in nano)
   
   # Make it readable only by you
   chmod 600 .env.production
   ```
   
   **What `chmod 600` does:** Makes the file readable/writable only by you (owner). This protects your passwords and secrets.

### Step 7.5: Build and Deploy the Application

1. **Navigate to the application directory:**
   ```bash
   cd /opt/app/site
   ```

2. **Build the Docker containers:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```
   
   **What this does:**
   - Reads `docker-compose.prod.yml` (production configuration)
   - Downloads all required base images
   - Builds your application container
   - This may take 5-15 minutes the first time
   
   **What you'll see:** Lots of output showing downloads and build steps. This is normal.

3. **Start all services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
   
   **Breaking this down:**
   - `up`: Start all containers defined in docker-compose.prod.yml
   - `-d`: Run in "detached" mode (in the background)
   
   **What this starts:**
   - Database container (PostgreSQL)
   - Redis container (for caching)
   - Your Next.js application container
   - Nginx container (web server)

4. **Check that everything is running:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```
   
   **What to look for:** All containers should show "Up" status. If any show "Restarting" or "Exited", there's a problem.

5. **Check the logs if something is wrong:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```
   
   **Or check logs for a specific service:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs app
   docker-compose -f docker-compose.prod.yml logs db
   ```

### Step 7.6: Verify the Application is Running

1. **Test the application locally:**
   ```bash
   curl -I http://127.0.0.1:3000
   ```
   
   **What this does:** Tests if the web server is responding. You should see HTTP status codes.
   
   **What to look for:** Should see `HTTP/1.1 200 OK` or similar success code.

2. **Test with a web browser (if you have GUI access):**
   - Open a browser on the VM (if you installed a desktop)
   - Or from your Admin PC via Tailscale, you might be able to access `http://192.168.20.10:3000`
   - You should see your website homepage

**Troubleshooting:**
- If containers won't start, check the logs: `docker-compose -f docker-compose.prod.yml logs`
- If database connection fails, verify `.env.production` has correct database credentials
- If port 3000 is already in use, check what's using it: `sudo netstat -tulpn | grep 3000`
- If build fails, check you have enough disk space: `df -h`
- If you see "permission denied" errors, make sure you're in the docker group: `groups`

---

## Step 7A: Restore Database from Development Backup

**What you're doing:** Copying your development database (with all your content, posts, projects, etc.) to the production server. This is a critical step that must be done before going live.

**IMPORTANT:** This step should be done AFTER Step 7 (Docker is running) but BEFORE Step 8 (Cloudflare Tunnel - going live). You want your database ready before the site is publicly accessible.

### Step 7A.1: Prepare Database Backup from Development Server

**On your development machine (where you have the backup):**

1. **Locate your database backup:**
   - Your backups are typically in: `backups/database/`
   - Look for a file like: `database_backup_YYYYMMDD_HHMMSS.sql.gz` or `backup_YYYYMMDD_HHMMSS.sql.gz`
   - Note the full path to this file

2. **Verify the backup file exists and is valid:**
   ```bash
   # On Windows (Command Prompt or PowerShell):
   dir backups\database\*.sql.gz
   
   # Check the file isn't corrupted (if you have gzip):
   gzip -t backups\database\your-backup-file.sql.gz
   ```

### Step 7A.2: Transfer Backup to Production Server

**You have several options to transfer the file:**

**Option A: Using SCP (Secure Copy) - Recommended if you have SSH access:**

1. **From your development machine, transfer the file:**
   ```bash
   # If using Tailscale to access the server:
   scp backups/database/your-backup-file.sql.gz ubuntu@<server-tailscale-ip>:/home/ubuntu/
   
   # Or if using the DMZ IP (if you have direct access):
   scp backups/database/your-backup-file.sql.gz ubuntu@192.168.20.10:/home/ubuntu/
   ```
   
   **What this does:** Copies the file from your computer to the server's home directory.
   
   **You'll be prompted for:**
   - The server password (the one you set during Ubuntu installation)
   - Or use SSH keys if you've set them up

**Option B: Using a USB drive or network share:**
1. Copy the backup file to a USB drive
2. Connect to the VM (via console in Proxmox or via Tailscale)
3. Mount the USB drive and copy the file

**Option C: Download directly on the server (if backup is online):**
1. If your backup is stored in cloud storage (Google Drive, Dropbox, etc.)
2. Use `wget` or `curl` on the server to download it

### Step 7A.3: Ensure Database Container is Running

**On the production server (Ubuntu VM):**

1. **Check if database container is running:**
   ```bash
   cd /opt/app/site
   docker-compose -f docker-compose.prod.yml ps db
   ```
   
   **What to look for:** Should show "Up" status. If not, start it:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d db
   ```

2. **Wait for database to be ready:**
   ```bash
   # Check database logs to ensure it's fully started
   docker-compose -f docker-compose.prod.yml logs db | tail -20
   ```
   
   **What to look for:** Should see messages like "database system is ready to accept connections"

3. **Verify database is accessible:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
   ```
   
   **What this does:** Tests if PostgreSQL is ready to accept connections. Should output: `postgresql://postgres@localhost:5432/postgres - accepting connections`

### Step 7A.4: Restore the Database Backup

1. **Decompress the backup file (if it's compressed):**
   ```bash
   cd ~
   gunzip your-backup-file.sql.gz
   ```
   
   **What this does:** Uncompresses the `.gz` file, leaving you with a `.sql` file.
   
   **Note:** If your backup is already `.sql` (not `.sql.gz`), skip this step.

2. **Import the database:**
   ```bash
   docker-compose -f /opt/app/site/docker-compose.prod.yml exec -T db psql -U postgres -d personal_website < your-backup-file.sql
   ```
   
   **Breaking this down:**
   - `exec -T db`: Execute a command in the database container (without allocating a TTY)
   - `psql -U postgres -d personal_website`: Connect to PostgreSQL as user "postgres" to database "personal_website"
   - `< your-backup-file.sql`: Feed the SQL file into the database
   
   **What this does:** Imports all your data (posts, projects, users, etc.) into the production database.
   
   **What you'll see:** Lots of SQL commands being executed. This may take 1-5 minutes depending on database size. You'll see output like "CREATE TABLE", "INSERT", etc.

3. **Verify the import was successful:**
   ```bash
   docker-compose -f /opt/app/site/docker-compose.prod.yml exec db psql -U postgres -d personal_website -c "SELECT COUNT(*) FROM posts;"
   docker-compose -f /opt/app/site/docker-compose.prod.yml exec db psql -U postgres -d personal_website -c "SELECT COUNT(*) FROM projects;"
   ```
   
   **What this does:** Counts records in your tables. You should see numbers matching your development database.
   
   **If you see errors:** Check that:
   - The database name matches (`personal_website`)
   - The backup file is valid (not corrupted)
   - The database container has enough disk space

4. **Clean up the backup file (optional, for security):**
   ```bash
   rm your-backup-file.sql
   rm your-backup-file.sql.gz  # if you still have the compressed version
   ```
   
   **Why:** The backup file contains sensitive data. Once imported, you can delete it from the server (keep your original backup safe on your development machine!)

### Step 7A.5: Verify Database Content in Application

1. **Restart the application to ensure it picks up the database:**
   ```bash
   cd /opt/app/site
   docker-compose -f docker-compose.prod.yml restart app
   ```

2. **Check application logs:**
   ```bash
   docker-compose -f docker-compose.prod.yml logs app | tail -30
   ```
   
   **What to look for:** Should see successful database connections, no errors.

3. **Test the website locally:**
   ```bash
   curl http://127.0.0.1:3000
   ```
   
   Or access via browser at `http://192.168.20.10:3000` (if accessible via Tailscale)
   
   **What to check:**
   - Homepage loads
   - Blog posts are visible (if you have a blog)
   - Projects are visible (if you have projects)
   - Content matches your development site

**Troubleshooting:**
- If import fails with "database does not exist", create it first:
  ```bash
  docker compose -f /opt/app/site/docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE personal_website;"
  ```
- If import fails with "permission denied", check database user permissions
- If you see "out of memory" errors, the database might be too large - check available RAM: `free -h`
- If tables are empty after import, check the backup file was complete and not corrupted
- If you get "relation already exists" errors, the database might already have data. You may need to drop and recreate it (be careful!):
  ```bash
  # WARNING: This deletes all existing data!
  docker compose -f /opt/app/site/docker-compose.prod.yml exec db psql -U postgres -c "DROP DATABASE personal_website;"
  docker compose -f /opt/app/site/docker-compose.prod.yml exec db psql -U postgres -c "CREATE DATABASE personal_website;"
  # Then try the import again
```

---

## Step 8: Configure Cloudflare Tunnel

**What you're doing:** Setting up Cloudflare Tunnel (formerly Argo Tunnel) to securely expose your website to the internet without opening ports on your firewall. This is more secure than traditional port forwarding.

**What is Cloudflare Tunnel?** It creates an encrypted connection from your server to Cloudflare's network. Traffic goes through Cloudflare's secure tunnel, so you don't need to open ports on your router. This protects your server from direct internet attacks.

### Step 8.1: Install Cloudflared

1. **Install Cloudflared:**
```bash
   sudo apt update
sudo apt install -y cloudflared
   ```
   
   **What this does:** Installs the Cloudflared software that creates the tunnel.

2. **Verify installation:**
   ```bash
   cloudflared --version
   ```
   
   **What to look for:** Should display version information.

### Step 8.2: Authenticate with Cloudflare

1. **Log in to Cloudflare:**
   ```bash
sudo cloudflared tunnel login
   ```
   
   **What this does:** Opens a web browser (or gives you a URL) to authenticate with your Cloudflare account.
   
   **What you'll see:** A URL will be displayed. Copy and paste it into a web browser.

2. **Complete authentication:**
   - Open the URL in a web browser (on any device)
   - Log in to your Cloudflare account
   - Select the domain you want to use (e.g., `willworkforlunch.com`)
   - Click "Authorize" or "Allow"
   - The browser will show "Success!"

3. **Verify authentication:**
   ```bash
   ls -la ~/.cloudflared/
   ```
   
   **What to look for:** Should see a `.json` file (certificate file). This proves authentication worked.

### Step 8.3: Create a Tunnel

1. **Create a new tunnel:**
   ```bash
sudo cloudflared tunnel create webnode-01
```

   **What this does:** Creates a new tunnel named "webnode-01". You can use any name you like.
   
   **What you'll see:** Output showing the tunnel was created with a UUID (unique identifier).

2. **Note the tunnel UUID:**
   - The output will show something like: `Created tunnel webnode-01 with id <uuid-here>`
   - Write down this UUID - you'll need it in the next step

### Step 8.4: Configure the Tunnel

1. **Create the configuration directory:**
   ```bash
   sudo mkdir -p /etc/cloudflared
   ```

2. **Create the configuration file:**
   ```bash
   sudo nano /etc/cloudflared/config.yml
   ```

3. **Add the tunnel configuration:**
```yaml
tunnel: webnode-01
   credentials-file: /root/.cloudflared/<uuid>.json
ingress:
  - hostname: www.willworkforlunch.com
       service: http://127.0.0.1:3000
  - service: http_status:404
```

   **Breaking this down:**
   - `tunnel: webnode-01`: The name of your tunnel (must match what you created)
   - `credentials-file: /root/.cloudflared/<uuid>.json`: Path to the authentication file
     - **Replace `<uuid>`** with the actual UUID from Step 8.3
     - To find it: `ls /root/.cloudflared/` - it will be the `.json` file
   - `hostname: www.willworkforlunch.com`: Your domain name
   - `service: http://127.0.0.1:3000`: Where your website is running (localhost port 3000)
   - `service: http_status:404`: Catch-all for any other hostnames (returns 404 error)

4. **Find the correct credentials file path:**
   ```bash
   sudo ls -la /root/.cloudflared/
   ```
   
   **What this shows:** Lists the `.json` file. The filename will be the UUID. Update the config file with the correct path.

5. **Save the configuration:**
   - Press `Ctrl + O`, then `Enter`
   - Press `Ctrl + X`

### Step 8.5: Configure DNS in Cloudflare Dashboard

**Before the tunnel works, you need to tell Cloudflare where to route traffic:**

1. **Log in to Cloudflare Dashboard:**
   - Go to https://dash.cloudflare.com
   - Log in with your account

2. **Select your domain:**
   - Click on `willworkforlunch.com` (or your domain)

3. **Go to DNS settings:**
   - Click on **"DNS"** in the left sidebar
   - Click on **"Records"** tab

4. **Create/update DNS records:**
   - Find or create a record for `www`:
     - **Type:** `CNAME`
     - **Name:** `www`
     - **Target:** `<uuid>.cfargotunnel.com` (replace `<uuid>` with your tunnel UUID from Step 8.3)
     - **Proxy status:** Proxied (orange cloud icon) - **IMPORTANT: Must be proxied!**
   - If you want the root domain too (`willworkforlunch.com` without www):
     - **Type:** `CNAME`
     - **Name:** `@` (or just the domain name)
     - **Target:** `<uuid>.cfargotunnel.com`
     - **Proxy status:** Proxied (orange cloud)

5. **Save the DNS records**

### Step 8.6: Install Tunnel as a Service

1. **Install the tunnel as a system service:**
```bash
sudo cloudflared service install
   ```
   
   **What this does:** Configures Cloudflared to run automatically on boot and as a background service.

2. **Start the tunnel service:**
   ```bash
sudo systemctl enable --now cloudflared
```

   **What this does:**
   - `enable`: Makes the service start on boot
   - `--now`: Start it immediately

3. **Check the service status:**
   ```bash
   sudo systemctl status cloudflared
   ```
   
   **What to look for:** Should show "active (running)" in green. If you see red/errors, check the logs.

4. **Check tunnel logs:**
   ```bash
   sudo journalctl -u cloudflared -f
   ```
   
   **What this shows:** Real-time logs from the tunnel. You should see messages about connections being established.
   
   **Press `Ctrl + C` to exit the log viewer.**

### Step 8.7: Verify the Website is Publicly Accessible

1. **Wait a few minutes for DNS to propagate:**
   - DNS changes can take 1-5 minutes to spread across the internet
   - Be patient!

2. **Test from your Admin PC:**
   ```bash
   curl -I https://www.willworkforlunch.com
   ```
   
   **Or open in a web browser:**
   - Go to: `https://www.willworkforlunch.com`
   - You should see your website!

3. **Verify SSL certificate:**
   - The website should show a padlock icon (HTTPS)
   - Cloudflare automatically provides SSL certificates
   - If you see a certificate warning, wait a few more minutes

**Troubleshooting:**
- If the website doesn't load, check tunnel status: `sudo systemctl status cloudflared`
- Check tunnel logs for errors: `sudo journalctl -u cloudflared -n 50`
- Verify DNS is proxied (orange cloud) in Cloudflare dashboard
- Test if the app is running locally: `curl http://127.0.0.1:3000` on the server
- If you see "502 Bad Gateway", the tunnel can't reach your app - check the service URL in config.yml
- If DNS isn't working, wait longer (up to 24 hours for full propagation, usually 5-15 minutes)

---

## Step 9: Maintenance and Updates

**What you're doing:** Setting up procedures to keep your website updated with the latest code changes and security patches.

### Step 9.1: Manual Updates (When You Make Changes)

**When to use:** Whenever you push new code to your GitHub repository and want to deploy it to production.

1. **SSH into the production server:**
```bash
   ssh ubuntu@<server-tailscale-ip>
   # Or: ssh ubuntu@192.168.20.10
   ```

2. **Navigate to the application directory:**
   ```bash
   cd /opt/app/site
   ```

3. **Pull the latest code from GitHub:**
   ```bash
   git pull
   ```
   
   **What this does:** Downloads the latest changes from your repository.
   
   **If you see "Your local changes would be overwritten":**
   - You have local changes that conflict
   - Either commit them first, or stash them: `git stash` then `git pull`

4. **Rebuild and restart the containers:**
   ```bash
   cd /opt/app/site
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml up -d
   ```
   
   **What this does:**
   - `build`: Rebuilds containers with new code
   - `up -d`: Restarts containers with new images
   
   **This may take 5-10 minutes** depending on changes.

5. **Verify the update worked:**
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs app | tail -20
   ```
   
   **What to check:**
   - All containers show "Up"
   - No errors in logs
   - Website loads correctly in browser

### Step 9.2: Automated Updates (Optional - Advanced)

**What this does:** Automatically checks for updates every 30 minutes and deploys them. Use with caution!

**WARNING:** Only enable this if you're confident your code changes won't break the site. Test thoroughly in development first!

1. **Open the cron editor:**
```bash
crontab -e
   ```
   
   **What this does:** Opens your user's cron table (scheduled tasks).

2. **Choose an editor:**
   - If prompted, choose `nano` (easiest) by typing `1` and pressing Enter

3. **Add the auto-update line:**
   - Scroll to the bottom of the file
   - Add this line:
```bash
   */30 * * * * cd /opt/app/site && git pull && cd /opt/app/site && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d >> /var/log/auto-update.log 2>&1
   ```
   
   **Breaking this down:**
   - `*/30 * * * *`: Run every 30 minutes
   - `cd /opt/app/site`: Go to app directory
   - `git pull`: Get latest code
   - `docker-compose build`: Rebuild containers
   - `docker-compose up -d`: Restart with new code
   - `>> /var/log/auto-update.log 2>&1`: Save output to log file

4. **Save and exit:**
   - Press `Ctrl + O`, then `Enter`
   - Press `Ctrl + X`

5. **Verify cron job is set:**
   ```bash
   crontab -l
   ```
   
   **What this shows:** Lists all your cron jobs. You should see the line you just added.

6. **Check the log file (after 30 minutes):**
   ```bash
   tail -f /var/log/auto-update.log
   ```
   
   **What this shows:** Watch the log file in real-time to see if updates are happening.

**Alternative: Less aggressive auto-update (once per day at 2 AM):**
```bash
0 2 * * * cd /opt/app/site && git pull && cd /opt/app/site && docker-compose -f docker-compose.prod.yml build && docker-compose -f docker-compose.prod.yml up -d >> /var/log/auto-update.log 2>&1
```

### Step 9.3: Database Backups (Production)

**What you're doing:** Setting up automatic backups of your production database so you can restore if something goes wrong.

1. **Create a backup script:**
   ```bash
   nano ~/backup-production.sh
   ```

2. **Add backup script content:**
   ```bash
   #!/bin/bash
   # Production Database Backup Script
   
   BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="$HOME/backups"
   mkdir -p $BACKUP_DIR
   
   # Database backup
   cd /opt/app/site
   docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres personal_website | gzip > $BACKUP_DIR/database_$BACKUP_DATE.sql.gz
   
   # Content backup (uploads, images)
   tar -czf $BACKUP_DIR/content_$BACKUP_DATE.tar.gz -C /opt/app/site public/uploads public/images 2>/dev/null || true
   
   # Keep only last 7 days of backups (delete older ones)
   find $BACKUP_DIR -name "database_*.sql.gz" -mtime +7 -delete
   find $BACKUP_DIR -name "content_*.tar.gz" -mtime +7 -delete
   
   echo "Backup completed: $BACKUP_DATE"
   ```
   
   **What this does:**
   - Creates timestamped database backup
   - Creates timestamped content backup
   - Keeps only last 7 days of backups (saves disk space)

3. **Make the script executable:**
   ```bash
   chmod +x ~/backup-production.sh
   ```

4. **Test the backup script:**
   ```bash
   ~/backup-production.sh
   ```
   
   **Verify it worked:**
   ```bash
   ls -lh ~/backups/
   ```
   
   **What to look for:** Should see backup files with today's date.

5. **Schedule daily backups (at 2 AM):**
   ```bash
   crontab -e
   ```
   
   Add this line:
   ```bash
   0 2 * * * $HOME/backup-production.sh >> $HOME/backup.log 2>&1
   ```

### Step 9.4: Security Checklist

**Critical security items to verify:**

1. **Disable port forwarding and UPnP on your router:**
   - Log into your CAX30 router admin panel
   - Go to **Advanced → Port Forwarding**
   - Make sure no port forwarding rules are enabled
   - Go to **Advanced → UPnP**
   - Disable UPnP (Universal Plug and Play)

2. **Verify DMZ isolation:**
   - From the web server VM, test that it CANNOT reach private networks:
   ```bash
   ping -c 3 192.168.1.1   # Should FAIL (timeout)
   ping -c 3 192.168.10.10  # Should FAIL (timeout)
   ```
   - If these succeed, there's a security problem! Check iptables rules on Proxmox.

3. **Verify SSH and Proxmox are only accessible via Tailscale:**
   - Try accessing Proxmox web interface from a device NOT on Tailscale - should fail
   - Try SSH to the web server from outside Tailscale - should fail
   - Only Tailscale devices should be able to connect

4. **Verify public traffic goes through Cloudflare Tunnel:**
   - Check that your website is accessible at `https://www.willworkforlunch.com`
   - Check Cloudflare dashboard shows traffic/analytics
   - No ports should be open on your router for web traffic

5. **Secure sensitive files:**
   ```bash
   cd /opt/app/site
chmod 600 .env.production
```
   
   **What this does:** Makes `.env.production` readable/writable only by owner (protects passwords/secrets).

6. **Regular security updates:**
   ```bash
   # Update system packages weekly
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images monthly
   docker-compose -f /opt/app/site/docker-compose.prod.yml pull
   docker-compose -f /opt/app/site/docker-compose.prod.yml up -d
   ```

**Troubleshooting:**
- If backups fail, check disk space: `df -h`
- If cron jobs don't run, check cron service: `sudo systemctl status cron`
- If you can ping private networks from DMZ, check Proxmox iptables rules (Step 4)

---

## Step 10: Verification Tests

**What you're doing:** Running final tests to ensure everything is working correctly and securely. These tests verify connectivity, isolation, and public accessibility.

### Step 10.1: Test Internet Connectivity from DMZ

**On the Ubuntu web server VM:**

1. **Test internet connectivity:**
```bash
curl -I https://cloudflare.com
   ```
   
   **What this does:** Tests if the VM can reach the internet through Cloudflare's website.
   
   **What to look for:** Should see HTTP response headers. If you see "Connection refused" or timeout, check:
   - NAT is configured correctly on Proxmox (Step 4)
   - DNS is working: `ping -c 3 8.8.8.8`

2. **Test DNS resolution:**
   ```bash
   nslookup www.willworkforlunch.com
   ```
   
   **What this does:** Tests if the VM can resolve domain names to IP addresses.
   
   **What to look for:** Should show the IP address of your domain (Cloudflare's IP).

### Step 10.2: Verify Network Isolation (Security Test)

**CRITICAL:** These tests should FAIL. If they succeed, your DMZ is not properly isolated!

**On the Ubuntu web server VM:**

1. **Test that DMZ CANNOT reach LAN network:**
   ```bash
   ping -c 3 192.168.1.1
   ```
   
   **What this does:** Tries to ping your router on the LAN network.
   
   **Expected result:** Should timeout or fail with "Destination host unreachable"
   
   **If it succeeds:** This is a security problem! The DMZ should NOT be able to reach your LAN. Check iptables rules on Proxmox (Step 4).

2. **Test that DMZ CANNOT reach Management network:**
   ```bash
   ping -c 3 192.168.10.10
   ```
   
   **What this does:** Tries to ping Proxmox on the management network.
   
   **Expected result:** Should timeout or fail
   
   **If it succeeds:** This is a security problem! The DMZ should NOT be able to reach your management network. Check iptables rules on Proxmox (Step 4).

3. **Test that DMZ CAN reach internet (should succeed):**
   ```bash
   ping -c 3 8.8.8.8
   ```
   
   **What this does:** Tests internet connectivity.
   
   **Expected result:** Should succeed (3 successful replies)

### Step 10.3: Verify Website Functionality

**From your Admin PC (or any internet-connected device):**

1. **Test homepage:**
   - Open web browser
   - Go to: `https://www.willworkforlunch.com`
   - **What to check:**
     - Page loads without errors
     - HTTPS padlock icon is visible (secure connection)
     - No certificate warnings
     - Content displays correctly

2. **Test specific pages:**
   - Blog page: `https://www.willworkforlunch.com/blog`
   - Projects page: `https://www.willworkforlunch.com/projects`
   - Admin panel: `https://www.willworkforlunch.com/admin` (if applicable)
   - **What to check:** All pages load correctly with your content

3. **Test database content:**
   - Verify blog posts are visible
   - Verify projects are visible
   - Verify images/media files load
   - **What to check:** Content matches what you have in development

4. **Test from command line (optional):**
   ```bash
   curl -I https://www.willworkforlunch.com
   ```
   
   **What to look for:** Should see `HTTP/2 200` or `HTTP/1.1 200 OK`

### Step 10.4: Verify Security Settings

1. **Check Cloudflare dashboard:**
   - Log in to https://dash.cloudflare.com
   - Go to your domain → Overview
   - **What to check:**
     - SSL/TLS encryption mode is set to "Full" or "Full (strict)"
     - Proxy status shows "Proxied" (orange cloud) for DNS records
     - Firewall rules are active (if you set any)

2. **Check Tailscale access:**
   - From your Admin PC, verify you can access:
     - Proxmox web interface via Tailscale IP
     - SSH to web server via Tailscale IP
   - From a device NOT on Tailscale, verify you CANNOT access these (should fail)

3. **Check router settings:**
   - Log into CAX30 router
   - **What to check:**
     - Port forwarding is disabled
     - UPnP is disabled
     - No firewall rules allowing direct access to DMZ

### Step 10.5: Performance Check

1. **Test website speed:**
   - Use tools like:
     - https://pagespeed.web.dev/
     - https://www.webpagetest.org/
   - **What to check:** Website loads reasonably fast (under 3 seconds)

2. **Check server resources:**
   ```bash
   # On the web server VM
   docker stats
   ```
   
   **What this shows:** CPU and memory usage of containers
   
   **What to look for:** Containers should not be using 100% CPU or memory

3. **Check disk space:**
   ```bash
   df -h
   ```
   
   **What to check:** You should have at least 20% free disk space

### Step 10.6: Final Checklist

- [ ] Website is publicly accessible at `https://www.willworkforlunch.com`
- [ ] All pages load correctly with content
- [ ] HTTPS/SSL certificate is valid (padlock icon)
- [ ] Database content is visible (posts, projects, etc.)
- [ ] DMZ cannot reach LAN network (192.168.1.x) - ping fails
- [ ] DMZ cannot reach Management network (192.168.10.x) - ping fails
- [ ] DMZ can reach internet - ping to 8.8.8.8 succeeds
- [ ] Proxmox is only accessible via Tailscale
- [ ] Web server SSH is only accessible via Tailscale
- [ ] Router port forwarding is disabled
- [ ] Router UPnP is disabled
- [ ] Cloudflare Tunnel is running: `sudo systemctl status cloudflared`
- [ ] Docker containers are all running: `docker-compose -f docker-compose.prod.yml ps`
- [ ] Database backups are scheduled and working

**Troubleshooting:**
- If website doesn't load, check Cloudflare Tunnel status: `sudo systemctl status cloudflared`
- If content is missing, verify database was restored correctly (Step 7A)
- If isolation tests fail (DMZ can reach private networks), re-check iptables rules on Proxmox
- If SSL certificate shows errors, wait 5-10 minutes for Cloudflare to provision it
- If pages load slowly, check server resources and consider optimizing images/content

---

## ✅ Conclusion

Congratulations! You now have a fully isolated, securely managed self-hosted Next.js deployment using:

- **Proxmox VE** for virtualization - Runs your virtual machines efficiently
- **Netgear GS308EP** for VLAN segmentation - Separates networks for security
- **CAX30** router for WAN and LAN separation - Provides internet and network routing
- **Tailscale** for private remote management - Secure VPN for accessing your servers
- **Cloudflare Tunnel** for secure public access - Protects your server from direct internet attacks

### What You've Accomplished

1. ✅ Created a secure, isolated network architecture with VLANs
2. ✅ Set up Proxmox with proper network bridges for each VLAN
3. ✅ Configured NAT and firewall rules to isolate the DMZ
4. ✅ Secured access to Proxmox via Tailscale VPN
5. ✅ Created and configured an Ubuntu web server VM
6. ✅ Deployed your Next.js application with Docker
7. ✅ Restored your development database to production
8. ✅ Configured Cloudflare Tunnel for public access
9. ✅ Set up automated backups and maintenance procedures
10. ✅ Verified everything is working and secure

### Next Steps

- **Regular maintenance:** Run system updates weekly, check backups monthly
- **Monitor:** Set up monitoring (optional) to track website uptime and performance
- **Backup verification:** Periodically test restoring from backups to ensure they work
- **Security updates:** Keep all software updated, especially Docker images and system packages
- **Content updates:** Use the update procedures in Step 9 when you make changes

### Important Reminders

- **Never expose Proxmox or SSH directly to the internet** - Always use Tailscale
- **Keep backups current** - Test restores periodically
- **Monitor disk space** - Clean up old backups and logs regularly
- **Review security settings quarterly** - Ensure isolation is still working
- **Document any custom changes** - Future you will thank present you

### Getting Help

If you encounter issues:
1. Check the troubleshooting sections in each step
2. Review error messages carefully - they often tell you exactly what's wrong
3. Check logs: `docker-compose logs`, `sudo journalctl -u cloudflared`, etc.
4. Verify network connectivity and isolation with the tests in Step 10
5. Consult the official documentation for each tool (Proxmox, Docker, Cloudflare, etc.)

**You're now running a production-grade, self-hosted website with enterprise-level security!** 🎉  
