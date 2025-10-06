# Update Node.js to Latest LTS

Your VPS currently has Node.js 20.0.0. Let's update to the latest 20.x LTS.

## SSH into VPS

```bash
ssh ubuntu@43.200.220.234
```

## Option 1: Using apt (Recommended for Ubuntu)

```bash
# Remove old Node.js
sudo apt remove nodejs -y

# Add NodeSource repository for Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install latest Node.js 20.x
sudo apt install -y nodejs

# Verify version
node --version  # Should show v20.18+ (latest LTS)
npm --version   # Should show 10.8+
```

## Option 2: Using n (Version Manager)

```bash
# Install n version manager
sudo npm install -g n

# Install latest LTS
sudo n lts

# Verify
node --version
```

## After Update

```bash
# Restart the ingestor with new Node version
pm2 restart roro-ingestor

# Check it's running
pm2 logs roro-ingestor --lines 20

# Save PM2 config
pm2 save
```

## Expected Output

```
ubuntu@ip-172-26-12-146:~$ node --version
v20.18.0

ubuntu@ip-172-26-12-146:~$ npm --version
10.8.2
```

## Troubleshooting

**If pm2 stops working after Node update:**
```bash
# Reinstall PM2
sudo npm install -g pm2

# Restore saved processes
pm2 resurrect

# Or manually restart ingestor
cd roro-dashboard/ingestor
pm2 start ingest.mjs --name roro-ingestor
pm2 save
```

**If you get permission errors:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

## Estimated Time

⏱️ **5 minutes** (includes download + restart)
