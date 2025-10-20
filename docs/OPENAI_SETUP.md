# OpenAI MCP Integration Setup

This guide explains how to configure the Zoho CRM MCP server for use with OpenAI's MCP integration.

## Prerequisites

1. **Zoho CRM Account** with API access
2. **Zoho OAuth Application** configured
3. **Server/Cloud Platform** for hosting
4. **OpenAI MCP Client** (Claude Desktop, etc.)

## Step 1: Deploy the MCP Server

### Option A: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alonso-interconnecta/nazareno-zcrm-mcp.git
   cd nazareno-zcrm-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your Zoho credentials
   ```

4. **Complete OAuth flow**:
   ```bash
   npm run dev
   # Visit http://localhost:8001/oauth/authorize
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

### Option B: Docker Deployment

1. **Build the Docker image**:
   ```bash
   docker build -t zoho-crm-mcp .
   ```

2. **Run with environment variables**:
   ```bash
   docker run -d \
     --name zoho-crm-mcp \
     -p 8000:8000 \
     -p 8001:8001 \
     -e ZOHO_CLIENT_ID=your_client_id \
     -e ZOHO_CLIENT_SECRET=your_client_secret \
     -e ZOHO_REGION=com \
     -v $(pwd)/tokens.json:/app/tokens.json \
     zoho-crm-mcp
   ```

3. **Complete OAuth flow**:
   ```bash
   # Visit http://localhost:8001/oauth/authorize
   ```

## Step 2: Configure OpenAI MCP Client

### Claude Desktop Configuration

Add to your Claude Desktop MCP configuration file:

```json
{
  "mcpServers": {
    "zoho-crm": {
      "command": "node",
      "args": ["/path/to/zoho-crm-mcp/dist/server.js"],
      "env": {
        "ZOHO_CLIENT_ID": "your_zoho_client_id",
        "ZOHO_CLIENT_SECRET": "your_zoho_client_secret",
        "ZOHO_REGION": "com",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### HTTP Endpoint Configuration (Alternative)

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

## Step 3: Available Tools

Once configured, you'll have access to these MCP tools:

### 1. `search_records`
Search records in any Zoho CRM module with criteria, pagination, and sorting.

**Parameters:**
- `module` (required): CRM module name (e.g., "Leads", "Contacts", "Accounts")
- `criteria` (optional): Search criteria in format 'field:value'
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Records per page (default: 25, max: 200)
- `sort_by` (optional): Field to sort by
- `sort_order` (optional): "asc" or "desc" (default: "asc")
- `fields` (optional): Specific fields to return

**Example:**
```json
{
  "module": "Leads",
  "criteria": "Last_Name:starts_with:S",
  "page": 1,
  "per_page": 10,
  "sort_by": "Created_Time",
  "sort_order": "desc"
}
```

### 2. `get_record`
Get a specific record by ID from any Zoho CRM module.

**Parameters:**
- `module` (required): CRM module name
- `record_id` (required): Record ID to retrieve
- `fields` (optional): Specific fields to return

**Example:**
```json
{
  "module": "Leads",
  "record_id": "12345678901234567890",
  "fields": ["First_Name", "Last_Name", "Email", "Phone"]
}
```

### 3. `list_modules`
List all available Zoho CRM modules.

**Parameters:**
- `type` (optional): "all", "custom", or "standard" (default: "all")

### 4. `get_module_fields`
Get field metadata for a specific CRM module.

**Parameters:**
- `module` (required): CRM module name

**Example:**
```json
{
  "module": "Leads"
}
```

### 5. `health_check`
Check the health status of the server and Zoho CRM API connection.

**Parameters:** None

## Step 4: Testing the Integration

1. **Start the MCP server**:
   ```bash
   npm start
   ```

2. **Test health check**:
   ```bash
   curl http://localhost:8000/health
   ```

3. **Test OAuth flow**:
   ```bash
   curl http://localhost:8001/oauth/authorize
   ```

4. **Verify MCP tools**:
   Use your MCP client to test the available tools.

## Troubleshooting

### Common Issues

1. **OAuth Errors**:
   - Check client ID/secret in `.env`
   - Verify redirect URI in Zoho console
   - Ensure OAuth flow is completed

2. **Token Issues**:
   - Check `tokens.json` file exists
   - Verify token format and expiration
   - Re-run OAuth flow if needed

3. **API Errors**:
   - Check Zoho CRM permissions
   - Verify module names are correct
   - Check API rate limits

4. **Connection Issues**:
   - Verify network connectivity
   - Check firewall settings
   - Ensure ports are accessible

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
DEBUG=zoho-crm-mcp:*
```

### Health Check

Monitor server health:

```bash
curl http://localhost:8000/health
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` or `tokens.json` to version control
2. **HTTPS**: Use HTTPS in production
3. **API Keys**: Secure your API keys
4. **Token Storage**: Secure token storage
5. **CORS**: Configure CORS properly

## Support

For issues and questions:
- Check the troubleshooting section
- Review server logs
- Verify OAuth configuration
- Test API connectivity
- Check GitHub issues: https://github.com/alonso-interconnecta/nazareno-zcrm-mcp/issues
