# Zoho CRM MCP Server - Node.js TypeScript Implementation

A powerful Model Context Protocol (MCP) server that provides seamless integration with Zoho CRM API, built with Node.js and TypeScript. This implementation offers dual-endpoint support for both Claude Desktop and OpenAI API platforms.

## 🚀 Features

- **Dual-Endpoint Architecture**: Supports both Claude Desktop (`/sse`) and OpenAI API (`/mcp`) endpoints
- **Type-Safe**: Fully written in TypeScript with comprehensive type definitions
- **Modern Node.js**: Built with ES modules and latest Node.js features
- **Robust Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health checks and monitoring
- **Configurable**: Flexible configuration via environment variables
- **Production Ready**: Includes security, CORS, rate limiting, and more
- **Read-Only Operations**: Safe search and get operations across all CRM modules

## 📋 Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Zoho CRM Account**: With API access and OAuth credentials

## 🛠️ Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd zoho-crm-mcp

# Install dependencies
npm install

# Copy environment template
cp env.example .env
```

### 2. Configure OAuth Credentials

Edit `.env` file with your Zoho OAuth credentials:

```env
# Zoho CRM OAuth Configuration
ZOHO_CLIENT_ID=your_zoho_client_id_here
ZOHO_CLIENT_SECRET=your_zoho_client_secret_here
ZOHO_REGION=com

# Server Configuration
NODE_ENV=development
PORT=8000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
```

### 3. Complete OAuth Flow

1. **Start the server**: `npm run dev`
2. **Visit the OAuth page**: http://localhost:8001/
3. **Click "Start OAuth Flow"** to begin authorization
4. **Authorize the application** in Zoho
5. **Tokens will be saved automatically** to your `.env` file

## 🔐 OAuth Setup Process

### Step 1: Create Zoho OAuth Application

1. **Go to Zoho Developer Console**: https://api-console.zoho.com/
2. **Create a new client** or use an existing one
3. **Set the redirect URI** to: `http://localhost:8001/oauth/callback`
4. **Select the required scopes**:
   - `ZohoCRM.modules.ALL` - Access to all CRM modules
   - `ZohoCRM.users.ALL` - Access to user information
   - `ZohoCRM.settings.ALL` - Access to module and field metadata
5. **Copy your Client ID and Client Secret** to the `.env` file

### Step 2: Complete OAuth Flow

1. **Fill in your credentials** in the `.env` file:
   ```env
   ZOHO_CLIENT_ID=your_client_id_here
   ZOHO_CLIENT_SECRET=your_client_secret_here
   ```

2. **Start the server**: `npm run dev`

3. **Visit the OAuth page**: http://localhost:8001/

4. **Click "Start OAuth Flow"** - you'll be redirected to Zoho with required scopes

5. **Authorize the application** in Zoho

6. **Refresh token is saved automatically** - you'll see a success page

7. **Server uses refresh token** to get access tokens for API calls

## 🔄 OAuth Flow Details

### Server-Based OAuth (Not Self-Client)

1. **Authorization URL** includes required scopes:
   - `ZohoCRM.modules.ALL`
   - `ZohoCRM.users.ALL` 
   - `ZohoCRM.settings.ALL`

2. **User Authorization** - User authorizes the application in Zoho

3. **Code Exchange** - Server exchanges authorization code for refresh token

4. **Token Usage** - Server uses refresh token to get access tokens for API calls

5. **Automatic Refresh** - Server automatically refreshes access tokens when needed

## 🎯 Available Tools

The MCP server provides the following tools for Zoho CRM integration:

### Core Operations
- `search_records` - Search records in any CRM module with filtering and pagination
- `get_record` - Get specific record details by ID

### Utility Operations
- `list_modules` - List all available CRM modules
- `get_module_fields` - Get field metadata for a specific module
- `health_check` - Test server and API connectivity

## 🏢 Supported CRM Modules

All standard Zoho CRM modules are supported:

### Sales Modules
- **Leads** - Lead management and tracking
- **Contacts** - Contact information and relationships
- **Accounts** - Account management and company data
- **Deals** - Sales opportunity tracking
- **Quotes** - Quote generation and management
- **Sales_Orders** - Sales order processing
- **Invoices** - Invoice creation and tracking

### Marketing Modules
- **Campaigns** - Marketing campaign management
- **Vendors** - Vendor relationship management

### Support Modules
- **Cases** - Customer support case management
- **Solutions** - Knowledge base and solutions

### Activity Modules
- **Tasks** - Task management and tracking
- **Calls** - Call logging and history
- **Meetings** - Meeting scheduling and notes
- **Events** - Event management

### Inventory Modules
- **Products** - Product catalog management
- **Price_Books** - Pricing management
- **Purchase_Orders** - Purchase order processing

### General Modules
- **Notes** - Notes and attachments for any module

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

### OAuth Flow (Port 8001)
- `GET /` - OAuth setup page with instructions
- `GET /oauth/authorize` - Start OAuth authorization flow
- `GET /oauth/callback` - OAuth callback handler
- `GET /health` - Health check endpoint

### MCP Server (Port 8000)
- `POST /mcp/` - MCP endpoint for Claude Desktop and OpenAI API
- `GET /health` - Health check endpoint

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZOHO_CLIENT_ID` | Zoho OAuth Client ID | **Required** |
| `ZOHO_CLIENT_SECRET` | Zoho OAuth Client Secret | **Required** |
| `ZOHO_REFRESH_TOKEN` | Zoho OAuth Refresh Token | Auto-generated |
| `ZOHO_ACCESS_TOKEN` | Zoho OAuth Access Token | Auto-generated |
| `ZOHO_TOKEN_EXPIRES_AT` | Token expiration timestamp | Auto-generated |
| `ZOHO_REGION` | Zoho region (com, eu, in, etc.) | `com` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | MCP server port | `8000` |
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
zoho-crm-mcp/
├── src/
│   ├── config/          # Configuration management
│   ├── tools/           # MCP tool implementations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server entry point
├── docs/                # Documentation
│   ├── QUICK_START.md   # Quick setup guide
│   ├── OPENAI_SETUP.md  # OpenAI MCP integration
│   └── DEPLOYMENT.md    # Production deployment
├── scripts/             # Build and utility scripts
├── tests/               # Test files
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Project configuration
├── tsconfig.json        # TypeScript configuration
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose setup
└── README.md            # This file
```

## 🔐 Security Features

- **Helmet**: Security headers and protection
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Configurable request rate limiting
- **Input Validation**: Zod-based schema validation
- **Error Handling**: Secure error messages in production
- **Read-Only Operations**: Safe, non-destructive operations only

## 📊 Monitoring & Logging

### Logging
- **Winston**: Structured logging with multiple transports
- **Log Levels**: error, warn, info, debug
- **File Logging**: Optional file output
- **JSON Format**: Structured log format for analysis

### Health Checks
- **API Connectivity**: Tests Zoho CRM API connection
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

2. **Zoho CRM API Authentication Failed**
   ```bash
   Error: Failed to refresh access token
   ```
   - Verify Zoho OAuth credentials
   - Check refresh token is still valid
   - Ensure region is correct

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
DEBUG=zoho-crm-mcp:*
```

## 📚 Documentation

For detailed setup and deployment instructions, see the documentation in the `/docs` folder:

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running quickly
- **[OpenAI MCP Setup](docs/OPENAI_SETUP.md)** - OpenAI MCP integration guide
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions

## 🚀 Deployment

For detailed deployment instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Quick Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t zoho-crm-mcp .
docker run -d -p 8000:8000 -p 8001:8001 zoho-crm-mcp
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

- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/v3/)
- [Model Context Protocol Specification](https://github.com/anthropics/mcp)
- [Claude Desktop Documentation](https://docs.anthropic.com/claude/desktop)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 📞 Support

For issues and questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Search [existing issues](https://github.com/InterConnectaOrg/zoho-crm-mcp-node/issues)
3. Create a [new issue](https://github.com/InterConnectaOrg/zoho-crm-mcp-node/issues/new)

---

**Built with ❤️ using Node.js, TypeScript, and the Model Context Protocol**
