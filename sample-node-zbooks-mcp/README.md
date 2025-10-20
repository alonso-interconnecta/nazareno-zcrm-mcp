# Zoho Books MCP Server - Node.js TypeScript Implementation

A powerful Model Context Protocol (MCP) server that provides seamless integration with Zoho Books API, built with Node.js and TypeScript. This implementation offers dual-endpoint support for both Claude Desktop and OpenAI API platforms.

## 🚀 Features

- **Dual-Endpoint Architecture**: Supports both Claude Desktop (`/sse`) and OpenAI API (`/mcp`) endpoints
- **Type-Safe**: Fully written in TypeScript with comprehensive type definitions
- **Modern Node.js**: Built with ES modules and latest Node.js features
- **Robust Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health checks and monitoring
- **Configurable**: Flexible configuration via environment variables
- **Production Ready**: Includes security, CORS, rate limiting, and more

## 📋 Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Zoho Books Account**: With API access and OAuth credentials

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd node-zbooks-mcp

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your Zoho Books credentials:

```env
# Zoho API Configuration
ZOHO_CLIENT_ID=your_zoho_client_id_here
ZOHO_CLIENT_SECRET=your_zoho_client_secret_here
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token_here
ZOHO_ORGANIZATION_ID=your_zoho_organization_id_here
ZOHO_REGION=com

# Server Configuration
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
```

## 🎯 Available Tools

The MCP server provides the following tools for Zoho Books integration:

### Invoice Management
- `list_invoices` - List invoices with filtering and pagination
- `get_invoice` - Get specific invoice details
- `create_invoice` - Create new invoices

### Contact Management
- `list_contacts` - List customers and vendors
- `get_contact` - Get specific contact details
- `create_contact` - Create new customers/vendors

### Item Management
- `list_items` - List products and services
- `get_item` - Get specific item details
- `create_item` - Create new items
- `update_item` - Update existing items

### Sales Order Management
- `list_sales_orders` - List sales orders
- `get_sales_order` - Get specific sales order details

### Expense Management
- `list_expenses` - List expenses with filtering
- `get_expense` - Get specific expense details
- `create_expense` - Create new expenses

### Health Check
- `health_check` - Test server and API connectivity

## 🚀 Usage

### Development Mode

```bash
# Start in dual-endpoint mode (default)
npm run dev

# Start in Claude Desktop mode only
npm run start:claude

# Start in OpenAI API mode only
npm run start:openai

# Start with dual endpoints explicitly
npm run start:dual
```

### Production Mode

```bash
# Build the project
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Health check
npm run health-check
```

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Root Information
```
GET /
```

### Claude Desktop (SSE)
```
POST /sse/
```

### OpenAI API (JSON-RPC)
```
POST /mcp/
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZOHO_CLIENT_ID` | Zoho OAuth Client ID | **Required** |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth Client Secret | **Required** |
| `ZOHO_REFRESH_TOKEN` | Zoho OAuth Refresh Token | **Required** |
| `ZOHO_ORGANIZATION_ID` | Zoho Organization ID | **Required** |
| `ZOHO_REGION` | Zoho region (com, eu, in, etc.) | `com` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `8000` |
| `HOST` | Server host | `0.0.0.0` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |

### Server Modes

The server supports multiple startup modes:

```bash
# Dual endpoints (Claude + OpenAI)
npm run dev

# Claude Desktop only (STDIO)
npm run dev -- --stdio
npm run dev -- --claude-only

# OpenAI API only (HTTP)
npm run dev -- --openai-only

# Dual HTTP endpoints
npm run dev -- --dual-endpoints
```

## 🏗️ Project Structure

```
node-zbooks-mcp/
├── src/
│   ├── config/          # Configuration management
│   ├── tools/           # MCP tool implementations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── server/          # Server-specific modules
│   └── server.ts        # Main server entry point
├── scripts/             # Build and utility scripts
├── docs/                # Documentation
├── tests/               # Test files
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 🔐 Security Features

- **Helmet**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Configurable request rate limiting
- **Input Validation**: Zod-based schema validation
- **Error Handling**: Secure error messages in production

## 📊 Monitoring & Logging

### Logging
- **Winston**: Structured logging with multiple transports
- **Log Levels**: error, warn, info, debug
- **File Logging**: Optional file output
- **JSON Format**: Structured log format for analysis

### Health Checks
- **API Connectivity**: Tests Zoho Books API connection
- **Memory Usage**: Monitors memory consumption
- **Uptime**: Tracks server uptime
- **Custom Checks**: Extensible health check system

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   ```bash
   Error: Missing required environment variables
   ```
   - Ensure all required variables are set in `.env`
   - Copy from `env.example` and fill in values

2. **Zoho API Authentication Failed**
   ```bash
   Error: Failed to refresh access token
   ```
   - Verify Zoho OAuth credentials
   - Check refresh token is still valid
   - Ensure organization ID is correct

3. **Port Already in Use**
   ```bash
   Error: EADDRINUSE: address already in use
   ```
   - Change `PORT` in `.env` file
   - Kill process using the port: `lsof -ti:8000 | xargs kill`

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
DEBUG=zoho-mcp:*
```

## 🚀 Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8000
CMD ["node", "dist/server.js"]
```

### PM2 Process Manager

```json
{
  "name": "zoho-mcp-server",
  "script": "dist/server.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 8000
  }
}
```

### systemd Service

```ini
[Unit]
Description=Zoho Books MCP Server
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/zoho-mcp
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📝 License

MIT License - see LICENSE file for details.

## 🔗 Related Links

- [Zoho Books API Documentation](https://www.zoho.com/books/api/v3/)
- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [Claude Desktop Documentation](https://docs.anthropic.com/claude/desktop)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 📞 Support

For issues and questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search [existing issues](https://github.com/InterConnectaOrg/zoho-books-mcp-node/issues)
3. Create a [new issue](https://github.com/InterConnectaOrg/zoho-books-mcp-node/issues/new)

---

**Built with ❤️ using Node.js, TypeScript, and the Model Context Protocol** 