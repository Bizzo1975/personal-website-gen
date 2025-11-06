# PROXMOX WEB HOSTING MASTER PLAN
## Option A - Complete Deployment Guide

**Created for:** www.willworkforlunch.com  
**Infrastructure Deployment Reference**  
**Document Version:** 1.0

---

## DEPLOYMENT GUIDE

This comprehensive guide provides the full step-by-step configuration for hosting a Next.js + TypeScript website on an Ubuntu VM within a Proxmox VE environment. The setup uses a Netgear GS308EP managed switch and a Netgear Nighthawk CAX30 router, ensuring network isolation and secure remote management through Tailscale and Cloudflare Tunnel.

**Note for Beginners:** This guide is written for someone with high school education and no coding experience. Each step includes detailed explanations of what you're doing and why. If you encounter any errors, read the error message carefully and refer to the troubleshooting sections throughout this guide.

---

## STEP 0: IP AND VLAN PLAN

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

## STEP 1: HARDWARE AND CABLE CONNECTIONS

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

*[Note: This is an abbreviated version showing the structure. The full document continues with all 10 steps including detailed instructions for each section.]*

---

## PRINT NOTES

This document is formatted for printing. When printing:
- Use standard 8.5" x 11" paper
- Set margins to 0.75" minimum
- Enable background graphics for best readability
- Print in color for status indicators (optional)
- Consider printing double-sided to save paper
- For the complete detailed guide, see the HTML version for better formatting

---

*End of Abbreviated Version - Full document available in HTML format*


