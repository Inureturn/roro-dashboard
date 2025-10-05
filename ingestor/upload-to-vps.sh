#!/bin/bash
# Upload and Deploy Script - Run from LOCAL machine
# Usage: ./upload-to-vps.sh user@your-vps-ip

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 user@vps-ip"
    echo "Example: $0 deploy@123.45.67.89"
    exit 1
fi

VPS_HOST=$1
REMOTE_DIR="ais-ingestor"

echo "========================================="
echo "📦 Uploading AIS Ingestor to VPS"
echo "========================================="
echo ""
echo "Target: $VPS_HOST:~/$REMOTE_DIR"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Make sure to create .env on the VPS after upload."
    echo ""
fi

# Upload files using rsync
echo "📤 Uploading files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '*.log' \
    ./ $VPS_HOST:~/$REMOTE_DIR/

echo ""
echo "✅ Upload complete!"
echo ""
echo "========================================="
echo "Next steps on VPS:"
echo "========================================="
echo ""
echo "1. SSH into your VPS:"
echo "   ssh $VPS_HOST"
echo ""
echo "2. Navigate to directory:"
echo "   cd $REMOTE_DIR"
echo ""
echo "3. Run deployment script:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo "========================================="
