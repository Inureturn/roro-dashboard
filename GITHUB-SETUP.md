# GitHub Setup & Deployment Guide

Complete step-by-step guide to push this project to GitHub and deploy from there.

## Prerequisites

- Git installed on Windows
- GitHub account
- VPS with SSH access

## Step 1: Install Git (if needed)

```powershell
# Windows PowerShell (as Administrator)
winget install --id Git.Git -e
```

Restart your terminal after installation.

## Step 2: Configure Git Identity

Set your git user (required for commits):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

Verify:

```bash
git config --global user.name
git config --global user.email
```

## Step 3: Make Initial Commit

```bash
# Navigate to project
cd C:\Users\Bilel\Downloads\cig-dashboard

# Files are already staged, just commit
git commit -m "Initial commit: AIS ingestor + VPS deployment setup

- Node.js 20 ESM ingestor with AISStream.io WebSocket
- 100m/180s rate limiting with haversine distance
- Supabase integration with service role
- Complete VPS deployment scripts and guides
- PM2 and systemd service files
- PostgreSQL schema with PostGIS support
- Documentation and setup instructions"
```

## Step 4: Create GitHub Repository

### Via GitHub Web UI

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `roro-dashboard`
   - **Description**: Real-time vessel tracking dashboard for RoRo fleet operations
   - **Visibility**: Choose Public or Private
   - ⚠️ **DO NOT** initialize with README, .gitignore, or license (we already have them)
3. Click **Create repository**

### Get Your Repository URL

After creation, GitHub shows your repo URL:

```
https://github.com/YOUR_USERNAME/roro-dashboard.git
```

Copy this URL!

## Step 5: Set Up Authentication

### Option A: HTTPS with Personal Access Token (Recommended)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Settings:
   - **Note**: "RoRo Dashboard Deploy"
   - **Expiration**: 90 days (or longer)
   - **Scopes**: Check `repo` (gives full control of private repositories)
4. Click **Generate token**
5. **Copy the token immediately** (you won't see it again!)

When git asks for password, use this token instead.

### Option B: SSH Keys (Advanced)

See GitHub docs: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## Step 6: Push to GitHub

```bash
# Set main branch
git branch -M main

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/roro-dashboard.git

# Push to GitHub
git push -u origin main
```

When prompted:
- **Username**: Your GitHub username
- **Password**: Your Personal Access Token (from Step 5)

## Step 7: Verify

Go to your GitHub repository URL:
```
https://github.com/YOUR_USERNAME/roro-dashboard
```

You should see all your files!

## Step 8: Deploy to VPS from GitHub

### Option A: Clone Fresh on VPS

```bash
# SSH to your VPS
ssh deploy@your-vps-ip

# Clone repository
git clone https://github.com/YOUR_USERNAME/roro-dashboard.git
cd roro-dashboard/ingestor

# Create .env file
nano .env
```

Paste your credentials:

```bash
SUPABASE_URL=https://rbffmfuvqgxlthzvmtir.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
AISSTREAM_KEY=1dfeab96e859583ebb41bdedf1cc47d781f4d633
FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
LOG_LEVEL=info
```

Save (Ctrl+X, Y, Enter), then deploy:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Option B: Update Existing Deployment

```bash
# On VPS
cd ~/ais-ingestor
git pull origin main
npm install --production
pm2 restart ais-ingestor
```

## Future Updates Workflow

### Make Changes Locally

```bash
# Edit files...

# Commit changes
git add .
git commit -m "Description of changes"
git push origin main
```

### Update VPS

```bash
# SSH to VPS
ssh deploy@your-vps-ip
cd roro-dashboard/ingestor

# Pull latest
git pull origin main

# Install any new dependencies
npm install --production

# Restart
pm2 restart ais-ingestor
```

## Troubleshooting

### "Permission denied (publickey)" error

You're using SSH URL instead of HTTPS. Change to HTTPS:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/roro-dashboard.git
```

### "Authentication failed" error

Your Personal Access Token is wrong or expired. Generate a new one (Step 5).

### Git asks for password every time

Set up credential caching:

```bash
# Cache for 1 hour
git config --global credential.helper cache

# Or store permanently (less secure)
git config --global credential.helper store
```

### Files already staged but can't commit

Configure git identity first:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Security Notes

✅ **DO** commit:
- Source code
- Documentation
- Configuration examples (.env.example)
- Deployment scripts

❌ **DON'T** commit:
- `.env` files (secrets are in .gitignore)
- `node_modules/` (generated files)
- API keys or passwords

The `.gitignore` file already protects sensitive data.

## Next Steps

Once pushed to GitHub:

1. ✅ Repository is backed up safely
2. ✅ Easy deployment to VPS via `git clone`
3. ✅ Version control for all changes
4. ✅ Can collaborate with team members
5. ✅ Easy rollback if needed

Ready to deploy! 🚀
