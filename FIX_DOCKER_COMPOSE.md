# Fix Docker Compose and Permissions Issues

## Current Issues

1. **docker-compose is broken** - Python 3.12 removed `distutils` which docker-compose v1.29.2 requires
2. **Sudo prompts** - User is not in docker group

## Quick Fix Commands

**Since Docker was installed from Ubuntu's repositories, use this fix:**

```bash
# Fix docker-compose v1 (Python 3.12 compatibility)
sudo apt install -y python3-setuptools

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER

# Activate the docker group (no logout needed)
newgrp docker

# Verify docker-compose works
docker-compose --version

# Verify docker works without sudo
docker ps
```

## Why docker-compose-plugin isn't available

If you see "Unable to locate package docker-compose-plugin", it's because:
- `docker-compose-plugin` is only available if Docker was installed from Docker's official repository
- Since Docker was installed from Ubuntu's default repos (`docker.io`), you need to use `docker-compose` v1
- Fix it with `python3-setuptools` (which includes distutils)

**Note:** `python3-distutils` is NOT available in Ubuntu 24.04. Use `python3-setuptools` instead.

## Alternative: Install Docker from Official Repository

If you want to use `docker-compose-plugin` (v2), you'd need to install Docker from Docker's official repository:

```bash
# Install Docker from official repository (includes compose plugin)
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**However, the simpler solution is to just fix docker-compose v1 with python3-setuptools.**

## After Fixing

Once you've run the commands above, the startup script will:
- ✅ Work without sudo prompts
- ✅ Use docker-compose without errors
- ✅ Start all containers successfully

## Verify Everything Works

```bash
# Test docker without sudo
docker ps

# Test docker-compose
docker-compose --version

# Run the startup script
./startup-all.sh
```

