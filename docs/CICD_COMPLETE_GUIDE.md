# CI/CD Complete Guide — willworkforlunch.com

> **Who is this for?**
> This guide is written for someone with zero prior knowledge of CI/CD or GitHub automation. Every step is explained from first principles. Follow it top-to-bottom the first time; after that, your day-to-day workflow is just 3 commands.

---

## Table of Contents

1. [What is CI/CD and why do you need it?](#1-what-is-cicd-and-why-do-you-need-it)
2. [How this project's CI/CD works](#2-how-this-projects-cicd-works)
3. [One-time setup (do this once)](#3-one-time-setup-do-this-once)
   - [Step A — Add GitHub Secrets](#step-a--add-github-secrets)
   - [Step B — Sync branches for the first deployment](#step-b--sync-branches-for-the-first-deployment)
   - [Step C — Set up branch protection](#step-c--set-up-branch-protection)
4. [Your daily developer workflow](#4-your-daily-developer-workflow)
5. [Watching a deployment happen](#5-watching-a-deployment-happen)
6. [How to roll back if something goes wrong](#6-how-to-roll-back-if-something-goes-wrong)
7. [Reference: important file locations](#7-reference-important-file-locations)
8. [Troubleshooting common problems](#8-troubleshooting-common-problems)

---

## 1. What is CI/CD and why do you need it?

### The problem it solves

Before CI/CD, your deployment process was:
1. Edit files on Windows
2. Use WinSCP to copy them to the server
3. SSH in, run a rebuild script
4. Hope nothing broke

This is fragile. One wrong file copy, one forgotten change, one typo — and the live website goes down.

### What CI/CD does instead

**CI** (Continuous Integration) = Every time you push code to GitHub, automated tests run to check that nothing is broken.

**CD** (Continuous Deployment) = If the tests pass, GitHub automatically SSHs into your production server, pulls the new code, and rebuilds the site — all without you doing anything manually.

### The end result

Your workflow becomes:
1. Edit code on Windows
2. Push to GitHub (`git push`)
3. When ready to go live: create a Pull Request from `main` → `production` and click Merge
4. GitHub handles the rest — tests run, then the site deploys automatically

If the tests fail, the deployment never happens. Your live site is protected.

---

## 2. How this project's CI/CD works

```
Your Windows PC
      │
      │  git push origin main
      ▼
  GitHub (main branch)
      │
      │  You create a Pull Request
      │  main ──────────────────► production branch
      │                                │
      │                                │  GitHub Actions triggers
      ▼                                ▼
                             ┌─────────────────────┐
                             │   GitHub Actions     │
                             │                      │
                             │  1. Run npm tests    │
                             │     (if fail → stop) │
                             │                      │
                             │  2. SSH into server  │
                             │  3. git pull latest  │
                             │  4. Docker rebuild   │
                             │  5. Health check     │
                             └──────────┬──────────┘
                                        │
                                        │  SSH via Tailscale
                                        ▼
                             Production Server
                             100.97.107.40
                             /opt/app/site
                             willworkforlunch.com
```

### Key concepts

| Term | What it means in this project |
|------|-------------------------------|
| `main` branch | Your working branch — push here freely |
| `production` branch | What is live on the website — only update via Pull Request |
| GitHub Actions | GitHub's built-in automation runner — free for public repos |
| GitHub Secrets | Encrypted storage for passwords/keys that Actions can use |
| Tailscale | VPN that lets GitHub reach your private server securely |

### What the automation does step-by-step

When you merge a Pull Request into the `production` branch:

1. GitHub starts a "runner" (a temporary Linux machine)
2. It installs your Node.js dependencies
3. It runs `npm run test:ci` — your unit tests
4. **If tests fail:** everything stops. Your live site is unaffected. You get an email.
5. **If tests pass:** the runner SSHs into your server at `100.97.107.40`
6. On the server: `git reset --hard origin/production` — pulls your new code cleanly
7. Runs `./scripts/rebuild-and-start-production.sh` — rebuilds the Docker container
8. Polls `http://localhost:3000/api/health` to confirm the app is up
9. If health check fails: you get an email alert

---

## 3. One-time setup (do this once)

> **Current status after initial setup:**
> - SSH deploy key has been generated at `C:\Users\jonkd\.ssh\github_deploy_key`
> - The public key has been added to the production server
> - The workflow file is updated and ready
>
> **You still need to complete Steps A, B, and C below.**

---

### Step A — Add GitHub Secrets

GitHub Secrets are like a secure vault. The workflow needs three values to connect to your server. You add them once and GitHub encrypts them — they never appear in logs.

**1. Open your browser and go to:**
```
https://github.com/Bizzo1975/personal-website-gen/settings/secrets/actions
```

**2. Click "New repository secret" for each of the following:**

---

**Secret 1 of 3:**
- Name: `PROD_SERVER_IP`
- Value: `100.97.107.40`

---

**Secret 2 of 3:**
- Name: `PROD_USERNAME`
- Value: `prod-admin`

---

**Secret 3 of 3 — the SSH private key:**
- Name: `SSH_PRIVATE_KEY`
- Value: *(the contents of the file below)*

Open PowerShell and run this to copy the key content to your clipboard:
```powershell
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key" | Set-Clipboard
```

Then paste that into the Secret Value field. The value starts with `-----BEGIN OPENSSH PRIVATE KEY-----` and ends with `-----END OPENSSH PRIVATE KEY-----`. Make sure you copy the entire thing including those header/footer lines.

> **Security note:** Never commit either key file to git. They live only in `C:\Users\jonkd\.ssh\` and in GitHub's encrypted secrets vault.

---

### Step B — Sync branches for the first deployment

Your repository has two branches: `main` (latest dev work) and `production` (older). The first deployment needs to bring `production` up to date with `main`.

**What to do:**

1. Open your browser and go to:
   ```
   https://github.com/Bizzo1975/personal-website-gen/compare/production...main
   ```

2. You will see all the commits that are in `main` but not yet in `production`. Review this list — these are the changes that will go live.

3. Click **"Create pull request"**
   - Title: `Initial sync: bring production up to date with main`
   - Leave a description if you want

4. Click **"Create pull request"** again to confirm

5. Scroll down on the PR page and click **"Merge pull request"**, then **"Confirm merge"**

6. This will trigger the very first automated deployment. Go to the [Actions tab](https://github.com/Bizzo1975/personal-website-gen/actions) to watch it run.

> **Expected timing:** The Docker build takes 10–20 minutes. The full deployment takes 15–25 minutes.

---

### Step C — Set up branch protection

Branch protection prevents you from accidentally pushing code directly to `production` (bypassing tests). This is your safety net.

1. Go to:
   ```
   https://github.com/Bizzo1975/personal-website-gen/settings/branches
   ```

2. Click **"Add branch ruleset"** (or "Add rule" depending on your GitHub plan)

3. Configure as follows:
   - **Branch name pattern:** `production`
   - Check **"Require a pull request before merging"**
     - Check **"Require approvals"**: set to 0 (you are working solo)
   - Check **"Require status checks to pass before merging"**
     - In the search box, type `Run Tests` and select it
   - Check **"Do not allow bypassing the above settings"** (optional but recommended)

4. Click **"Create"** or **"Save changes"**

Now you cannot push to `production` without going through a PR, and the PR cannot be merged until the tests pass.

---

## 4. Your daily developer workflow

Once the one-time setup is done, your everyday process is simple.

### Making a change (step by step)

**1. Make sure you are on `main` and have the latest code:**
```powershell
cd "F:\Github\Running Apps\personal-website-gen"
git checkout main
git pull origin main
```

**2. Make your code changes** in Cursor/VS Code as normal.

**3. Save and test locally:**
```powershell
npm run dev
```
Visit `http://localhost:3000` to check your changes look right.

**4. Commit your changes:**
```powershell
git add .
git commit -m "describe what you changed"
```
Example commit messages:
- `"Fix contact form validation"`
- `"Add new blog post about networking"`
- `"Update homepage hero text"`

**5. Push to GitHub:**
```powershell
git push origin main
```

**6. When you are ready to deploy to the live site, create a Pull Request:**

Option A — using the browser:
```
https://github.com/Bizzo1975/personal-website-gen/compare/production...main
```
Click "Create pull request", add a title, then click "Merge pull request".

Option B — using GitHub CLI (faster, once you set it up):
```powershell
gh pr create --base production --head main --title "Deploy: your description"
gh pr merge --merge
```

**7. Watch the deployment:**
Go to https://github.com/Bizzo1975/personal-website-gen/actions

You will see a workflow run start. It goes through two stages:
- `Run Tests` — usually 2–5 minutes
- `Deploy to Production Server` — usually 15–25 minutes

When both have a green checkmark, your changes are live at willworkforlunch.com.

### Quick-reference cheat sheet

```
Daily work on main:
  git checkout main
  git pull origin main
  [make changes]
  git add .
  git commit -m "description"
  git push origin main

Deploy to production:
  Open PR: main → production
  Merge PR
  Watch Actions tab

Emergency manual deploy:
  Go to Actions tab → select "Deploy to Production" → "Run workflow"
```

---

## 5. Watching a deployment happen

1. Go to: https://github.com/Bizzo1975/personal-website-gen/actions

2. You will see a list of workflow runs. The newest one is at the top.

3. Click on the run to open it. You will see two jobs:

   **Run Tests** (yellow spinner = running, green check = passed, red X = failed)
   - If this fails, deployment is cancelled. Click to see which test failed.

   **Deploy to Production Server** (only starts after tests pass)
   - Click to expand and see live SSH output as the server rebuilds

4. The deployment is complete when both jobs show a green checkmark.

5. Verify the live site at: https://www.willworkforlunch.com

### Email notifications

GitHub sends you an email when:
- A workflow fails (so you know something went wrong)
- A workflow recovers after failing

You can configure notification preferences at:
https://github.com/settings/notifications

---

## 6. How to roll back if something goes wrong

If a deployment breaks the live site, you have two rollback options.

### Option 1 — Quick rollback via GitHub (recommended)

This reverts the production branch to the previous version and redeploys.

1. Find the last good deployment in the Actions tab
2. Note the commit SHA (e.g., `abc1234`)
3. Run in PowerShell:
   ```powershell
   cd "F:\Github\Running Apps\personal-website-gen"
   git checkout production
   git pull origin production
   git revert HEAD --no-edit
   git push origin production
   ```
   This creates a new commit that undoes the last change. GitHub Actions will automatically redeploy with the fix.

### Option 2 — Manual emergency rollback on the server

If you need to revert immediately without waiting for CI/CD:

```powershell
# SSH into the server
ssh prod-admin@100.97.107.40

# On the server:
cd /opt/app/site
git log --oneline -10          # Find the last good commit SHA
git checkout <commit-SHA>      # Switch to that version
./scripts/rebuild-and-start-production.sh
```

### Option 3 — Manual workflow trigger

If the code is fine but the deployment just needs to be re-run:

1. Go to the Actions tab
2. Click "Deploy to Production"
3. Click "Run workflow"
4. Select the `production` branch
5. Click "Run workflow" (green button)

---

## 7. Reference: important file locations

### On your Windows PC

| What | Location |
|------|----------|
| SSH deploy private key | `C:\Users\jonkd\.ssh\github_deploy_key` |
| SSH deploy public key | `C:\Users\jonkd\.ssh\github_deploy_key.pub` |
| Project codebase | `F:\Github\Running Apps\personal-website-gen` |
| GitHub Actions workflow | `.github\workflows\deploy.yml` |

### On the production server (100.97.107.40)

| What | Location |
|------|----------|
| App codebase | `/opt/app/site` |
| Environment secrets | `/opt/app/site/.env.production` |
| Rebuild script | `/opt/app/site/scripts/rebuild-and-start-production.sh` |
| Nginx config | `/opt/app/site/nginx.conf` |
| Docker compose file | `/opt/app/site/docker-compose.prod.yml` |
| Authorized SSH keys | `/home/prod-admin/.ssh/authorized_keys` |

### On GitHub

| What | URL |
|------|-----|
| Repository | https://github.com/Bizzo1975/personal-website-gen |
| Actions (deployments) | https://github.com/Bizzo1975/personal-website-gen/actions |
| Secrets settings | https://github.com/Bizzo1975/personal-website-gen/settings/secrets/actions |
| Branch protection | https://github.com/Bizzo1975/personal-website-gen/settings/branches |

---

## 8. Troubleshooting common problems

### "Tests failed — what do I do?"

1. Click on the failed workflow run in the Actions tab
2. Click on the "Run Tests" job
3. Find the red error in the log
4. Fix the issue in your code on `main`
5. Push the fix to `main`, then create a new PR

### "Deployment failed — SSH connection refused"

This usually means the GitHub Secret `PROD_SERVER_IP` is wrong, or the Tailscale connection to the server is down.

**Check:**
```powershell
ssh prod-admin@100.97.107.40 "echo connected"
```
If that fails, the server's Tailscale connection may be down. SSH in via the local network instead:
```powershell
ssh prod-admin@192.168.20.20 "sudo tailscale up"
```

### "Deployment failed — .env.production not found"

The `.env.production` file must exist on the server at `/opt/app/site/.env.production`. It is never stored in git (that would expose your passwords).

To restore it if missing, copy from your secure backup:
```powershell
scp "path\to\your\backup\.env.production" prod-admin@100.97.107.40:/opt/app/site/.env.production
```

### "Deployment failed — Docker build out of memory"

The server may be running low on memory. SSH in and check:
```powershell
ssh prod-admin@100.97.107.40 "free -h; df -h"
```
Then run the memory check script:
```powershell
ssh prod-admin@100.97.107.40 "cd /opt/app/site; ./scripts/check-memory-and-swap.sh"
```

### "The app deployed but the site looks wrong"

1. Check app logs:
   ```powershell
   ssh prod-admin@100.97.107.40 "cd /opt/app/site; docker compose -f docker-compose.prod.yml logs app --tail 50"
   ```
2. Check if the health endpoint is responding:
   ```powershell
   ssh prod-admin@100.97.107.40 "curl http://localhost:3000/api/health"
   ```
3. If needed, roll back using Option 1 or 2 in Section 6

### "I accidentally pushed directly to production"

If branch protection is enabled, this is not possible. If branch protection is not yet set up, run:
```powershell
git checkout production
git pull origin production
git revert HEAD --no-edit
git push origin production
```

### "Where is my deploy key? I need to regenerate it"

The private key is at `C:\Users\jonkd\.ssh\github_deploy_key`.

To regenerate (only do this if the key is lost or compromised):
```powershell
# 1. Generate a new key
ssh-keygen -t ed25519 -C "github-actions-deploy@willworkforlunch.com" -f "$env:USERPROFILE\.ssh\github_deploy_key" -N '""'

# 2. Add new public key to server
$pubKey = Get-Content "$env:USERPROFILE\.ssh\github_deploy_key.pub"
ssh prod-admin@100.97.107.40 "echo '$pubKey' > /home/prod-admin/.ssh/authorized_keys; chmod 600 /home/prod-admin/.ssh/authorized_keys"

# 3. Update the SSH_PRIVATE_KEY secret on GitHub (see Step A above)
Get-Content "$env:USERPROFILE\.ssh\github_deploy_key" | Set-Clipboard
# Then paste at: https://github.com/Bizzo1975/personal-website-gen/settings/secrets/actions
```

---

*Last updated: March 2026*
*See also: `docs/WINDOWS_TO_PROD_DEPLOY_GUIDE.md` for manual deployment fallback*
