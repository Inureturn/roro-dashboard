#!/bin/bash
# VPS Deployment Script for AIS Ingestor
# Run this on your VPS after uploading the code

set -e  # Exit on error

echo "========================================="
echo "AIS Ingestor - VPS Deployment"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo "❌ Please do not run as root. Use a regular user with sudo access."
   exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "⚠️  Node.js version $NODE_VERSION detected. Upgrading to Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    else
        echo "✅ Node.js $(node -v) detected"
    fi
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with your credentials."
    echo "Copy from .env.example:"
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo "✅ .env file found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --production

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Installing PM2 process manager..."
    sudo npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

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
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup auto-start on reboot (only if not already configured)
if [ ! -f /etc/systemd/system/pm2-$USER.service ]; then
    echo ""
    echo "🔧 Configuring auto-start on reboot..."
    echo "   Please run the following command when prompted:"
    pm2 startup
    echo ""
    echo "   After running the command above, re-run this script to complete setup."
else
    echo "✅ Auto-start already configured"
fi

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
echo "🛑 Stop:"
echo "  pm2 stop ais-ingestor"
echo ""
echo "========================================="
