#!/bin/bash

# Zoho CRM MCP Server Deployment Script
# This script deploys the application to the production server

set -e

# Configuration
SERVER_HOST="3.80.105.135"
SERVER_USER="ubuntu"
APP_NAME="nazareno-zcrm-mcp"
APP_PATH="/var/www/nazareno-zcrm-mcp"
LOG_PATH="/var/www/nazareno-zcrm-mcp/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSH key exists
if [ ! -f "nazareno-default.pem" ]; then
    log_error "SSH key 'nazareno-default.pem' not found in current directory"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 nazareno-default.pem

log_info "Starting deployment to $SERVER_HOST..."

# Build the application
log_info "Building application..."
npm run build

if [ $? -ne 0 ]; then
    log_error "Build failed!"
    exit 1
fi

log_success "Build completed successfully!"

# Create deployment package
log_info "Creating deployment package..."
mkdir -p deploy-package
        cp -r src deploy-package/
        cp -r dist deploy-package/
        cp package.json deploy-package/
        cp package-lock.json deploy-package/
        cp tsconfig.json deploy-package/
        cp ecosystem.config.js deploy-package/
cp -r docs deploy-package/
cp Dockerfile deploy-package/
cp docker-compose.yml deploy-package/
cp env.example deploy-package/
cp README.md deploy-package/
cp mcp-config.json deploy-package/
cp openai-mcp-config.json deploy-package/
tar -czf deploy-package.tar.gz deploy-package/

log_success "Deployment package created!"

# Deploy to server
log_info "Deploying to server..."

# Create application directory
ssh -i nazareno-default.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
    sudo mkdir -p $APP_PATH
    sudo chown $SERVER_USER:$SERVER_USER $APP_PATH
    mkdir -p $LOG_PATH
"

# Copy files to server
scp -i nazareno-default.pem -o StrictHostKeyChecking=no deploy-package.tar.gz $SERVER_USER@$SERVER_HOST:$APP_PATH/

# Extract and setup on server
ssh -i nazareno-default.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
    cd $APP_PATH
    
    # Backup existing deployment if it exists
    if [ -d 'current' ]; then
        mv current backup-\$(date +%Y%m%d-%H%M%S)
        log_info 'Previous deployment backed up'
    fi
    
    # Extract new deployment
    tar -xzf deploy-package.tar.gz
    mv deploy-package current
    rm deploy-package.tar.gz
    
    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        log_info 'Installing Node.js...'
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        log_info 'Installing PM2...'
        sudo npm install -g pm2
    fi
    
    # Install pnpm if not present
    if ! command -v pnpm &> /dev/null; then
        log_info 'Installing pnpm...'
        sudo npm install -g pnpm
    fi
    
    # Navigate to application directory
    cd $APP_PATH/current
    
    # Install dependencies (including dev dependencies for build)
    log_info 'Installing dependencies...'
    npm ci
    
    # Build the application
    log_info 'Building application...'
    npm run build
    
    # Create environment file if it doesn't exist
    if [ ! -f '.env' ]; then
        cp env.example .env
        log_warning 'Please configure your .env file with Zoho credentials'
    fi
    
    # Create tokens.json if it doesn't exist
    if [ ! -f 'tokens.json' ]; then
        echo '{}' > tokens.json
    fi
    
    # Set proper permissions
    sudo chown -R $SERVER_USER:$SERVER_USER $APP_PATH
    chmod +x dist/server.js
"

log_success "Files deployed to server!"

# Deploy with PM2
log_info "Starting application with PM2..."

ssh -i nazareno-default.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
    cd $APP_PATH/current
    
    # Stop existing PM2 process if running
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start the application with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 to start on boot
    pm2 startup systemd -u $SERVER_USER --hp /home/$SERVER_USER 2>/dev/null || true
    
    # Wait for application to start
    sleep 10
    
    # Health check
    if curl -f http://localhost:8000/health; then
        log_success 'Application deployed successfully!'
        echo '🌐 MCP Server: http://$SERVER_HOST:8000'
        echo '🔐 OAuth Setup: http://$SERVER_HOST:8001'
    else
        log_error 'Health check failed!'
        pm2 logs $APP_NAME --lines 20
        exit 1
    fi
"

# Verify deployment
log_info "Verifying deployment..."

ssh -i nazareno-default.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "
    # Check PM2 status
    echo '📊 PM2 Process Status:'
    pm2 list
    
    # Check ports
    echo '🔌 Port Status:'
    netstat -tlnp | grep -E ':(8000|8001)' || echo 'Ports not listening'
    
    # Check application health
    echo '❤️ Health Check:'
    curl -s http://localhost:8000/health | jq . 2>/dev/null || curl -s http://localhost:8000/health
    
    echo '✅ Deployment verification complete!'
"

# Cleanup
rm -rf deploy-package
rm -f deploy-package.tar.gz

log_success "Deployment completed successfully!"
echo ""
echo "🚀 Your Zoho CRM MCP server is now running at:"
echo "   📡 MCP Server: http://$SERVER_HOST:8000"
echo "   🔐 OAuth Setup: http://$SERVER_HOST:8001"
echo ""
echo "📋 Next steps:"
echo "   1. Visit http://$SERVER_HOST:8001 to complete OAuth setup"
echo "   2. Configure your .env file with Zoho credentials"
echo "   3. Test the MCP server at http://$SERVER_HOST:8000/health"
echo ""
echo "🔧 Management commands:"
echo "   pm2 list                    # List all processes"
echo "   pm2 logs $APP_NAME          # View logs"
echo "   pm2 restart $APP_NAME       # Restart application"
echo "   pm2 stop $APP_NAME          # Stop application"
