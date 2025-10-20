# Production Deployment Guide

This guide covers deploying the Zoho CRM MCP server to the production server alongside the existing `nazareno-processing` application.

## 🚀 Automated Deployment (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically deploys to the production server when code is pushed to the `main` branch.

### Prerequisites

1. **GitHub Secrets**: Add the following secrets to your GitHub repository:
   - `SERVER_SSH_KEY`: The private SSH key content (nazareno-default.pem)

2. **Server Access**: Ensure the server is accessible at `3.80.105.135`

### How it Works

1. **Trigger**: Pushes to `main` branch automatically trigger deployment
2. **Build**: Application is built and packaged
3. **Deploy**: Files are copied to `/var/www/nazareno-zcrm-mcp/`
4. **PM2 Management**: Application is managed with PM2 alongside existing app
5. **Health Check**: Deployment is verified with health checks

### Manual Trigger

You can also trigger deployment manually:
1. Go to GitHub Actions tab
2. Select "Deploy to Production Server" workflow
3. Click "Run workflow"

## 🛠️ Manual Deployment

### Prerequisites

- SSH access to the server
- `nazareno-default.pem` key file in project root
- Node.js 18+ and PM2 installed on server

### Quick Deployment

```bash
# Run the deployment script
./scripts/deploy.sh
```

### Step-by-Step Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Create deployment package**:
   ```bash
   mkdir -p deploy-package
   cp -r dist deploy-package/
   cp package.json deploy-package/
   cp package-lock.json deploy-package/
   cp ecosystem.config.js deploy-package/
   tar -czf deploy-package.tar.gz deploy-package/
   ```

3. **Deploy to server**:
   ```bash
   # Copy files
   scp -i nazareno-default.pem deploy-package.tar.gz ubuntu@3.80.105.135:/var/www/nazareno-zcrm-mcp/
   
   # Extract and setup
   ssh -i nazareno-default.pem ubuntu@3.80.105.135 "
     cd /var/www/nazareno-zcrm-mcp
     tar -xzf deploy-package.tar.gz
     mv deploy-package current
     cd current
     npm ci --production
   "
   ```

4. **Start with PM2**:
   ```bash
   ssh -i nazareno-default.pem ubuntu@3.80.105.135 "
     cd /var/www/nazareno-zcrm-mcp/current
     pm2 start ecosystem.config.js --env production
     pm2 save
   "
   ```

## 🏗️ Server Architecture

### Directory Structure

```
/var/www/
├── nazareno-processing/          # Existing app (untouched)
│   ├── src/
│   ├── package.json
│   └── ...
└── nazareno-zcrm-mcp/           # New MCP server
    ├── current/                 # Active deployment
    │   ├── dist/
    │   ├── package.json
    │   ├── ecosystem.config.js
    │   └── .env
    ├── backup-YYYYMMDD-HHMMSS/  # Previous deployments
    └── logs/                    # Application logs
        ├── app.log
        ├── error.log
        └── out.log
```

### PM2 Process Management

Both applications run independently under PM2:

```bash
# List all processes
pm2 list

# View logs
pm2 logs nazareno-zcrm-mcp
pm2 logs nazareno-processing

# Restart specific app
pm2 restart nazareno-zcrm-mcp

# Stop specific app
pm2 stop nazareno-zcrm-mcp
```

## 🔧 Configuration

### Environment Variables

Create `/var/www/nazareno-zcrm-mcp/current/.env`:

```env
# Zoho CRM OAuth Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REGION=com

# Server Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### OAuth Setup

1. **Complete OAuth flow**: Visit `http://3.80.105.135:8001/oauth/authorize`
2. **Authorize with Zoho**: Complete the OAuth authorization
3. **Tokens saved**: Tokens are automatically saved to `tokens.json`

## 📊 Monitoring

### Health Checks

- **MCP Server**: `http://3.80.105.135:8000/health`
- **OAuth Setup**: `http://3.80.105.135:8001/`

### Logs

```bash
# View application logs
pm2 logs nazareno-zcrm-mcp

# View specific log files
tail -f /var/www/nazareno-zcrm-mcp/logs/app.log
tail -f /var/www/nazareno-zcrm-mcp/logs/error.log
```

### Process Status

```bash
# Check PM2 status
pm2 status

# Check port usage
netstat -tlnp | grep -E ':(8000|8001)'

# Check system resources
htop
```

## 🔄 Updates and Maintenance

### Updating the Application

1. **Automatic**: Push to `main` branch (GitHub Actions)
2. **Manual**: Run `./scripts/deploy.sh`

### Rolling Back

```bash
# List available backups
ls -la /var/www/nazareno-zcrm-mcp/backup-*

# Rollback to previous version
ssh -i nazareno-default.pem ubuntu@3.80.105.135 "
  cd /var/www/nazareno-zcrm-mcp
  pm2 stop nazareno-zcrm-mcp
  mv current current-failed
  mv backup-YYYYMMDD-HHMMSS current
  cd current
  pm2 start ecosystem.config.js --env production
"
```

### Backup Strategy

- **Code**: Git repository serves as code backup
- **Configuration**: `.env` and `tokens.json` files
- **Logs**: Rotated automatically by PM2
- **Deployments**: Previous deployments kept as backups

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check port usage
   netstat -tlnp | grep -E ':(8000|8001)'
   
   # Kill process using port
   sudo fuser -k 8000/tcp
   ```

2. **PM2 process not starting**:
   ```bash
   # Check PM2 logs
   pm2 logs nazareno-zcrm-mcp
   
   # Restart PM2 daemon
   pm2 kill
   pm2 resurrect
   ```

3. **OAuth issues**:
   - Check Zoho credentials in `.env`
   - Verify redirect URI in Zoho console
   - Complete OAuth flow at `http://3.80.105.135:8001/`

4. **Memory issues**:
   ```bash
   # Check memory usage
   pm2 monit
   
   # Restart if needed
   pm2 restart nazareno-zcrm-mcp
   ```

### Debug Mode

Enable debug logging:

```bash
# Edit .env file
LOG_LEVEL=debug
DEBUG=zoho-crm-mcp:*

# Restart application
pm2 restart nazareno-zcrm-mcp
```

## 🔐 Security

### Firewall Configuration

```bash
# Allow MCP server ports
sudo ufw allow 8000
sudo ufw allow 8001

# Check firewall status
sudo ufw status
```

### SSL/HTTPS (Optional)

For production use, consider setting up SSL:

```bash
# Install certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

## 📞 Support

For deployment issues:

1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs nazareno-zcrm-mcp`
3. Check server logs: `journalctl -u pm2-ubuntu`
4. Verify network connectivity and firewall rules