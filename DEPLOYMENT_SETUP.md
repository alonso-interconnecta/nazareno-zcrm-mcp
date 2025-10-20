# 🚀 Production Deployment Setup Complete!

## ✅ What's Been Configured

### 1. **GitHub Actions CI/CD Pipeline**
- **File**: `.github/workflows/deploy.yml`
- **Trigger**: Automatic deployment on push to `main` branch
- **Manual Trigger**: Available in GitHub Actions tab
- **Features**: Build, package, deploy, health check, PM2 management

### 2. **PM2 Process Management**
- **File**: `ecosystem.config.js`
- **App Name**: `nazareno-zcrm-mcp`
- **Port**: 8000 (MCP server), 8001 (OAuth)
- **Logs**: `/var/www/nazareno-zcrm-mcp/logs/`
- **Auto-restart**: Configured with restart policies

### 3. **Deployment Script**
- **File**: `scripts/deploy.sh`
- **Usage**: `./scripts/deploy.sh`
- **Features**: Manual deployment, health checks, backup management

### 4. **Server Architecture**
```
/var/www/
├── nazareno-processing/          # Existing app (untouched)
└── nazareno-zcrm-mcp/           # New MCP server
    ├── current/                 # Active deployment
    ├── backup-*/               # Previous deployments
    └── logs/                   # Application logs
```

## 🔧 Next Steps

### 1. **Configure GitHub Secrets**
Add the SSH private key to GitHub repository secrets:
- Go to: Repository → Settings → Secrets and variables → Actions
- Add secret: `SERVER_SSH_KEY`
- Value: Content of `nazareno-default.pem` file

### 2. **First Deployment**
The GitHub Actions workflow will automatically deploy when you push to `main` branch, or you can trigger it manually.

### 3. **OAuth Setup**
After deployment:
1. Visit: `http://3.80.105.135:8001/oauth/authorize`
2. Complete Zoho OAuth authorization
3. Tokens will be saved automatically

### 4. **Verify Deployment**
- **MCP Server**: `http://3.80.105.135:8000/health`
- **OAuth Setup**: `http://3.80.105.135:8001/`
- **PM2 Status**: `pm2 list` (on server)

## 🛠️ Management Commands

### On the Server
```bash
# Check application status
pm2 list

# View logs
pm2 logs nazareno-zcrm-mcp

# Restart application
pm2 restart nazareno-zcrm-mcp

# Stop application
pm2 stop nazareno-zcrm-mcp

# Check health
curl http://localhost:8000/health
```

### Local Development
```bash
# Manual deployment
./scripts/deploy.sh

# Check deployment status
ssh -i nazareno-default.pem ubuntu@3.80.105.135 "pm2 list"
```

## 📊 Monitoring

### Health Endpoints
- **MCP Server**: `http://3.80.105.135:8000/health`
- **OAuth Setup**: `http://3.80.105.135:8001/`

### Logs Location
- **Application Logs**: `/var/www/nazareno-zcrm-mcp/logs/`
- **PM2 Logs**: `pm2 logs nazareno-zcrm-mcp`

### Process Monitoring
```bash
# Real-time monitoring
pm2 monit

# Process status
pm2 status

# Memory usage
pm2 show nazareno-zcrm-mcp
```

## 🔐 Security Features

- **PM2 Process Management**: Isolated process with restart policies
- **Log Rotation**: Automatic log rotation and cleanup
- **Backup Strategy**: Previous deployments kept as backups
- **Health Monitoring**: Built-in health checks and alerts
- **Non-Interference**: Runs alongside existing `nazareno-processing` app

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Comprehensive deployment documentation
- **[OpenAI Setup](docs/OPENAI_SETUP.md)** - OpenAI MCP integration
- **[Quick Start](docs/QUICK_START.md)** - Quick setup overview

## 🚨 Troubleshooting

### Common Issues

1. **Deployment fails**: Check GitHub Actions logs
2. **App not starting**: Check PM2 logs and server resources
3. **OAuth issues**: Verify Zoho credentials and redirect URI
4. **Port conflicts**: Check if ports 8000/8001 are available

### Debug Commands
```bash
# Check PM2 status
pm2 list

# View detailed logs
pm2 logs nazareno-zcrm-mcp --lines 50

# Check system resources
htop

# Check port usage
netstat -tlnp | grep -E ':(8000|8001)'
```

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ GitHub Actions workflow completes without errors
- ✅ PM2 shows `nazareno-zcrm-mcp` as `online`
- ✅ Health check returns 200 OK
- ✅ OAuth setup page is accessible
- ✅ Existing `nazareno-processing` app continues running

## 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review PM2 logs on server
3. Verify server connectivity
4. Check firewall and port configuration

---

**🚀 Your Zoho CRM MCP server is ready for production deployment!**
