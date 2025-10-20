#!/bin/bash
set -e

# --- Configuration ---
APP_DIR="/var/www/zoho_mcp_node"
USER="ubuntu"
SERVICE_NAME="zoho-mcp-node"
NODE_VERSION="18"

echo "--- Starting Node.js Zoho MCP Server Setup ---"

cd $APP_DIR

# --- Check if initial setup is needed ---
INITIAL_SETUP=false
if [ ! -d "node_modules" ]; then
    echo "--- Node modules not found, will install ---"
    INITIAL_SETUP=true
fi

if [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    echo "--- Systemd service not found, will create ---"
    INITIAL_SETUP=true
fi

# --- Initial Setup (only if needed) ---
if [ "$INITIAL_SETUP" = true ]; then
    echo "--- Performing initial setup ---"
    
    # Install Node.js 18 if not present
    if ! command -v node &> /dev/null || [ "$(node --version | cut -d'.' -f1 | cut -d'v' -f2)" -lt "$NODE_VERSION" ]; then
        echo "--- Installing Node.js $NODE_VERSION ---"
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install system dependencies
    echo "--- Installing system dependencies ---"
    sudo apt-get update
    sudo apt-get install -y git nginx curl

    # Install Node.js dependencies
    echo "--- Installing Node.js dependencies ---"
    npm ci --production

    # Create systemd service
    echo "--- Creating systemd service ---"
    sudo bash -c "cat > /etc/systemd/system/$SERVICE_NAME.service" << EOL
[Unit]
Description=Zoho Books MCP Server (Node.js)
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PATH=/usr/bin:/usr/local/bin:$APP_DIR/node_modules/.bin"
ExecStart=/usr/bin/node $APP_DIR/dist/server.js
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOL

    sudo systemctl daemon-reload
    sudo systemctl enable $SERVICE_NAME.service
    
    echo "--- Initial setup complete ---"
else
    echo "--- Skipping initial setup (already configured) ---"
fi

# --- Smart Dependency Management ---
# Check if we need to update dependencies
if [ "${PACKAGE_CHANGED:-0}" -gt "0" ]; then
    echo "--- Package.json changed, updating dependencies ---"
    npm ci --production
else
    echo "--- Package.json unchanged, skipping dependency update ---"
fi

# --- Update Configuration ---
echo "--- Updating configuration ---"

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "--- Creating .env file from template ---"
    cp env.example .env
    echo "⚠️  WARNING: Please update .env file with your actual Zoho credentials"
fi

# --- Service Management ---
echo "--- Managing service ---"

# Stop service if running
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "--- Stopping $SERVICE_NAME service ---"
    sudo systemctl stop $SERVICE_NAME
fi

# Start service
echo "--- Starting $SERVICE_NAME service ---"
sudo systemctl start $SERVICE_NAME

# Check service status
sleep 3
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ $SERVICE_NAME service is running"
else
    echo "❌ $SERVICE_NAME service failed to start"
    sudo systemctl status $SERVICE_NAME
    exit 1
fi

# --- Health Check ---
echo "--- Performing health check ---"
sleep 5

if curl -s -f http://localhost:8001/health | grep -q "healthy"; then
    echo "✅ Node.js server health check passed"
else
    echo "⚠️  Health check failed, checking logs..."
    sudo journalctl -u $SERVICE_NAME -n 20 --no-pager
fi

echo "--- ✅ Node.js Setup Complete! ---"
echo "--- Server should be accessible on port 8001 ---"
echo "--- View logs: sudo journalctl -u $SERVICE_NAME -f ---" 