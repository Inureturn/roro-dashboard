# VPS Deployment Guide

Complete guide to deploying the AIS ingestor on a VPS.

## Recommended VPS Providers

### Budget-Friendly Options ($3-6/month)

1. **DigitalOcean** - $6/month
   - 1GB RAM, 1 vCPU, 25GB SSD
   - Excellent network reliability
   - Simple dashboard
   - [Sign up](https://www.digitalocean.com/pricing/droplets)

2. **Vultr** - $6/month
   - 1GB RAM, 1 vCPU, 25GB SSD
   - 17 global locations
   - Hourly billing
   - [Sign up](https://www.vultr.com/pricing/)

3. **Hetzner** - €4.15/month (~$4.50)
   - 2GB RAM, 1 vCPU, 20GB SSD
   - Best price/performance
   - EU/US locations
   - [Sign up](https://www.hetzner.com/cloud)

4. **Linode (Akamai)** - $5/month
   - 1GB RAM, 1 vCPU, 25GB SSD
   - Reliable infrastructure
   - Good documentation
   - [Sign up](https://www.linode.com/pricing/)

5. **Contabo** - €5/month (~$5.50)
   - 4GB RAM, 2 vCPU, 50GB SSD
   - Highest specs for price
   - EU/US locations
   - [Sign up](https://contabo.com/en/vps/)

### Recommended Choice
**Hetzner Cloud** offers the best value with 2GB RAM for ~$4.50/month, plenty for this Node.js app.

## VPS Setup

### 1. Create VPS Instance

Choose:
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **RAM**: Minimum 1GB (2GB recommended)
- **Location**: Closest to your users or Supabase region

### 2. Initial Server Setup

SSH into your VPS:

```bash
ssh root@your-vps-ip
```

Update system:

```bash
apt update && apt upgrade -y
```

Create deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
```

Set up SSH key for deploy user (optional but recommended):

```bash
su - deploy
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
```

### 3. Install Node.js 20

Using NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node --version  # Should show v20.x.x
npm --version
```

### 4. Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 5. Upload Application

From your local machine:

```bash
# Create tarball
cd cig-dashboard
tar -czf ingestor.tar.gz ingestor/

# Upload to VPS
scp ingestor.tar.gz deploy@your-vps-ip:~/

# Or use rsync for updates
rsync -avz --exclude node_modules ingestor/ deploy@your-vps-ip:~/ais-ingestor/
```

### 6. Configure Environment

On VPS:

```bash
cd ~/ais-ingestor
tar -xzf ../ingestor.tar.gz --strip-components=1  # If uploaded tarball
```

Create `.env` file:

```bash
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

Save and exit (Ctrl+X, Y, Enter).

### 7. Install Dependencies

```bash
npm install --production
```

### 8. Start with PM2

```bash
pm2 start ingest.mjs --name ais-ingestor --time
```

Enable auto-start on reboot:

```bash
pm2 save
pm2 startup
# Follow the command it outputs (run the sudo command)
```

### 9. Verify Running

Check status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs ais-ingestor
```

You should see:

```
[INIT] AIS Ingestor starting...
[INIT] Fleet MMSIs: 14
[INIT] Bounding boxes: 2
[WS] Connected
[WS] Subscription sent { bboxes: 2, mmsis: 14 }
```

## Firewall Setup (Optional)

If you want basic security:

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

The ingestor doesn't need any inbound ports open (only outbound to AISStream and Supabase).

## Monitoring

### PM2 Commands

```bash
pm2 status              # Show all processes
pm2 logs ais-ingestor   # Live logs
pm2 logs --lines 100    # Last 100 lines
pm2 monit               # Real-time monitoring
pm2 restart ais-ingestor # Restart
pm2 stop ais-ingestor   # Stop
pm2 delete ais-ingestor # Remove
```

### Check Resource Usage

```bash
htop                    # Interactive process viewer
free -h                 # Memory usage
df -h                   # Disk usage
```

## Updating the Code

When you make changes:

```bash
# On local machine
rsync -avz --exclude node_modules ingestor/ deploy@your-vps-ip:~/ais-ingestor/

# On VPS
cd ~/ais-ingestor
npm install --production
pm2 restart ais-ingestor
```

## Alternative: Docker Deployment

If you prefer Docker:

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker deploy
# Log out and back in
```

### 2. Build and Run

```bash
cd ~/ais-ingestor
docker build -t ais-ingestor .

docker run -d \
  --name ais-ingestor \
  --restart unless-stopped \
  --env-file .env \
  ais-ingestor
```

### 3. View Logs

```bash
docker logs -f ais-ingestor
```

### 4. Auto-start on Boot

Docker containers with `--restart unless-stopped` will auto-start.

## Alternative: Systemd Service

If you don't want PM2, use systemd:

See `ais-ingestor.service` file for configuration.

```bash
sudo cp ais-ingestor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ais-ingestor
sudo systemctl start ais-ingestor
sudo systemctl status ais-ingestor
```

View logs:

```bash
sudo journalctl -u ais-ingestor -f
```

## Troubleshooting

### No AIS messages appearing

1. Check logs for WebSocket connection:
   ```bash
   pm2 logs ais-ingestor | grep WS
   ```

2. Verify AISStream key is valid

3. Check if vessels are in your bounding boxes

4. Enable debug logging:
   ```bash
   # Edit .env
   LOG_LEVEL=debug
   pm2 restart ais-ingestor
   ```

### Database errors

1. Check service role key:
   ```bash
   # Test Supabase connection
   curl -H "apikey: your-service-role-key" \
        -H "Authorization: Bearer your-service-role-key" \
        https://rbffmfuvqgxlthzvmtir.supabase.co/rest/v1/vessels
   ```

2. Verify schema is created (see main README or schema.sql)

### Process crashes

1. Check PM2 error logs:
   ```bash
   pm2 logs ais-ingestor --err
   ```

2. Check system resources:
   ```bash
   free -h
   df -h
   ```

3. Restart:
   ```bash
   pm2 restart ais-ingestor
   ```

## Cost Estimate

- **VPS**: $4-6/month
- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **AISStream**: Free tier (up to 50 vessels)

**Total**: ~$5/month for 24/7 real-time tracking of 14 vessels

## Security Best Practices

1. **SSH keys only** - Disable password authentication
2. **Firewall** - Use ufw to block unused ports
3. **Regular updates** - `sudo apt update && sudo apt upgrade`
4. **Non-root user** - Always run as deploy user
5. **Environment secrets** - Never commit .env to git
6. **Fail2ban** - Optional, prevents brute force SSH

## Next Steps

Once deployed:

1. Monitor logs for first 24 hours
2. Check Supabase database for positions
3. Verify frontend dashboard connects
4. Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
