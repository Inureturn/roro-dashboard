#!/bin/bash
# One-command Lightsail deployment for AIS Ingestor
# Run this on your Lightsail instance

set -e

echo "========================================="
echo "🚀 RoRo Dashboard - Lightsail Deployment"
echo "========================================="
echo ""

# Update system
echo "📦 Updating system..."
sudo apt update -qq && sudo apt upgrade -y -qq

# Install Node.js 20
echo ""
echo "📦 Installing Node.js 20..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 20 ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js $(node -v) installed"

# Install Git if needed
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo apt install -y git
fi

# Clone repository
echo ""
echo "📥 Cloning repository..."
if [ -d "roro-dashboard" ]; then
    echo "   Repository exists, pulling latest..."
    cd roro-dashboard
    git pull origin main
else
    git clone https://github.com/Inureturn/roro-dashboard.git
    cd roro-dashboard
fi

# Navigate to ingestor
cd ingestor

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env <<'EOF'
SUPABASE_URL=https://rbffmfuvqgxlthzvmtir.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiZmZtZnV2cWd4bHRoenZtdGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY2NTkxMCwiZXhwIjoyMDc1MjQxOTEwfQ.ZtqstY5jRABvaO4S55TcZSNvG_wSl4DsLeDsxz7dMzA
AISSTREAM_KEY=1dfeab96e859583ebb41bdedf1cc47d781f4d633
FLEET_MMSIS=357170000,352808000,352001129,355297000,356005000,249901000,229077000,229076000,219927000,352001162,355137000,352001920,373817000,249904000
BBOX_JSON=[[124,33],[132,39]];[[-6,30],[36,46]]
LOG_LEVEL=info
EOF

echo "✅ .env file created"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Install PM2 globally
echo ""
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Stop existing instance if running
if pm2 list | grep -q "ais-ingestor"; then
    echo ""
    echo "🔄 Stopping existing instance..."
    pm2 stop ais-ingestor
    pm2 delete ais-ingestor
fi

# Start the ingestor
echo ""
echo "🚀 Starting AIS Ingestor..."
pm2 start ingest.mjs --name ais-ingestor --time

# Save PM2 process list
pm2 save

# Setup auto-start on reboot
echo ""
echo "🔧 Configuring auto-start on reboot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash
pm2 save

# Show status
echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
pm2 status
echo ""
echo "📊 View logs:"
echo "  pm2 logs ais-ingestor"
echo ""
echo "🔍 Monitor:"
echo "  pm2 monit"
echo ""
echo "🔄 Restart:"
echo "  pm2 restart ais-ingestor"
echo ""
echo "========================================="
echo ""
echo "🎉 AIS Ingestor is now running 24/7!"
echo "   Check logs to verify AIS data is flowing."
echo ""
