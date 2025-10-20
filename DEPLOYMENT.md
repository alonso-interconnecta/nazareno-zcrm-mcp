# Zoho CRM MCP Server - Deployment Guide

## OpenAI MCP Deployment

This guide explains how to deploy the Zoho CRM MCP server for use with OpenAI's MCP integration.

### Prerequisites

1. **Zoho CRM Account** with API access
2. **Zoho OAuth Application** configured
3. **Server/Cloud Platform** for hosting
4. **Domain name** with SSL certificate

### Step 1: Zoho OAuth Setup

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Create a new OAuth application
3. Set redirect URI to your production callback URL
4. Select required scopes:
   - `ZohoCRM.modules.ALL`
   - `ZohoCRM.users.ALL`
   - `ZohoCRM.settings.ALL`

### Step 2: Server Deployment

#### Environment Variables

Set these environment variables on your server:

```bash
# Zoho CRM OAuth Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REGION=com

# Server Configuration
NODE_ENV=production
PORT=8000
HOST=0.0.0.0

# Optional: Custom domain
DOMAIN=your-domain.com
```

#### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY tokens.json ./tokens.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8000

CMD ["node", "dist/server.js"]
```

#### PM2 Deployment

```json
{
  "name": "zoho-crm-mcp",
  "script": "dist/server.js",
  "instances": 1,
  "exec_mode": "fork",
  "env": {
    "NODE_ENV": "production",
    "PORT": 8000
  },
  "env_production": {
    "NODE_ENV": "production",
    "PORT": 8000
  }
}
```

### Step 3: OAuth Flow Completion

1. **Initial Setup**: Visit your deployed server's OAuth page
2. **Complete Authorization**: Go through the OAuth flow
3. **Token Storage**: Tokens will be saved to `tokens.json`
4. **Restart Server**: Restart to load the new tokens

### Step 4: OpenAI MCP Configuration

#### OpenAI MCP Server Configuration

```json
{
  "mcpServers": {
    "zoho-crm": {
      "command": "node",
      "args": ["/path/to/your/server/dist/server.js"],
      "env": {
        "ZOHO_CLIENT_ID": "your_client_id",
        "ZOHO_CLIENT_SECRET": "your_client_secret",
        "ZOHO_REGION": "com",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### HTTP Endpoint Configuration

If using HTTP endpoints instead of stdio:

```json
{
  "mcpServers": {
    "zoho-crm": {
      "url": "https://your-domain.com/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

### Step 5: Security Considerations

1. **HTTPS Required**: Always use HTTPS in production
2. **API Key Authentication**: Implement API key authentication
3. **Rate Limiting**: Configure rate limiting
4. **Token Security**: Secure token storage
5. **CORS Configuration**: Proper CORS settings

### Step 6: Monitoring and Maintenance

1. **Health Checks**: Monitor `/health` endpoint
2. **Token Refresh**: Monitor token expiration
3. **Logs**: Set up proper logging
4. **Backups**: Backup `tokens.json` file

### Troubleshooting

#### Common Issues

1. **OAuth Errors**: Check client ID/secret and redirect URI
2. **Token Expiration**: Re-run OAuth flow
3. **API Errors**: Check Zoho CRM permissions
4. **Connection Issues**: Verify network connectivity

#### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
DEBUG=zoho-crm-mcp:*
```

### Production Checklist

- [ ] HTTPS enabled
- [ ] OAuth flow completed
- [ ] Tokens saved and working
- [ ] Health check responding
- [ ] Rate limiting configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] API authentication enabled

### Support

For issues and questions:
- Check the troubleshooting section
- Review server logs
- Verify OAuth configuration
- Test API connectivity
