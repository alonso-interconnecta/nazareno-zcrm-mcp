#!/usr/bin/env node
/**
 * Zoho CRM MCP Server - Node.js TypeScript Implementation
 * Using FastMCP framework for automatic SSE transport handling
 */

import './polyfills.js';
import { FastMCP } from 'fastmcp';
import express from 'express';
import { config, checkRequiredEnvVars } from './config/index.js';
import { logger } from './utils/logger.js';
import { zohoCRMClient } from './utils/zoho-crm-client.js';
import { z } from 'zod';
import { OAuthHandler } from './utils/oauth-handler.js';

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Check environment variables (only required ones for OAuth flow)
    const requiredVars = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      logger.warn(`Missing OAuth credentials: ${missing.join(', ')}`);
      logger.info('OAuth flow will be available at /oauth/authorize');
    }
    
    // Validate configuration
    config.validate();
    
    logger.info('Starting Zoho CRM MCP Server with FastMCP', config.getSummary());

    // Create Express app for OAuth handling
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Initialize OAuth handler
    const oauthHandler = new OAuthHandler();
    
    // OAuth routes
    app.get('/oauth/authorize', async (req, res) => {
      try {
        const authUrl = await oauthHandler.getAuthorizationUrl();
        res.redirect(authUrl);
      } catch (error) {
        logger.error('OAuth authorization failed:', error);
        res.status(500).send('OAuth authorization failed');
      }
    });

    app.get('/oauth/callback', async (req, res) => {
      try {
        const { code, error } = req.query;
        
        if (error) {
          logger.error('OAuth callback error:', error);
          return res.status(400).send(`OAuth error: ${error}`);
        }

        if (!code) {
          return res.status(400).send('No authorization code received');
        }

        const tokens = await oauthHandler.exchangeCodeForTokens(code as string);
        
        // Save tokens to .env file
        await oauthHandler.saveTokensToEnv(tokens);
        
        return res.send(`
          <html>
            <body>
              <h1>✅ OAuth Success!</h1>
              <p>Tokens have been saved to your .env file.</p>
              <p>You can now restart the server to use the CRM API.</p>
              <p><a href="/health">Check server health</a></p>
            </body>
          </html>
        `);
      } catch (error) {
        logger.error('OAuth callback failed:', error);
        return res.status(500).send(`OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Root endpoint with OAuth instructions
    app.get('/', async (req, res) => {
      const oauthStatus = await oauthHandler.getOAuthStatus();
      
      res.send(`
        <html>
          <head>
            <title>Zoho CRM MCP Server</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
              .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
              .warning { background-color: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
              .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
              .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .button:hover { background-color: #0056b3; }
              pre { background-color: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>🚀 Zoho CRM MCP Server</h1>
            
            <div class="status ${oauthStatus.isConfigured ? 'success' : 'error'}">
              <strong>OAuth Status:</strong> ${oauthStatus.isConfigured ? 'Configured' : 'Not Configured'}
            </div>
            
            <div class="status ${oauthStatus.hasTokens ? 'success' : 'warning'}">
              <strong>Tokens:</strong> ${oauthStatus.hasTokens ? 'Available' : 'Not Available'}
            </div>
            
            <h2>📋 Setup Instructions</h2>
            <pre>${oauthStatus.instructions}</pre>
            
            <h2>🔗 Quick Actions</h2>
            <a href="/oauth/authorize" class="button">🔐 Start OAuth Flow</a>
            <a href="/health" class="button">❤️ Health Check</a>
            
            <h2>🔧 Zoho OAuth Configuration</h2>
            <p><strong>Redirect URI:</strong> <code>${oauthStatus.redirectUri}</code></p>
            <p><strong>Required Scopes:</strong></p>
            <ul>
              <li><code>ZohoCRM.modules.ALL</code> - Access to all CRM modules</li>
              <li><code>ZohoCRM.users.ALL</code> - Access to user information</li>
              <li><code>ZohoCRM.settings.ALL</code> - Access to module and field metadata</li>
            </ul>
            <p><strong>OAuth Flow:</strong> Server-based (not self-client)</p>
            <p><strong>How it works:</strong></p>
            <ol>
              <li>Authorization URL includes required scopes</li>
              <li>User authorizes and gets redirected back</li>
              <li>Server exchanges code for refresh token</li>
              <li>Server uses refresh token to get access tokens for API calls</li>
            </ol>
            
            <h2>📚 Available Endpoints</h2>
            <ul>
              <li><code>GET /</code> - This page</li>
              <li><code>GET /oauth/authorize</code> - Start OAuth flow</li>
              <li><code>GET /oauth/callback</code> - OAuth callback</li>
              <li><code>GET /health</code> - Server health check</li>
              <li><code>POST /mcp</code> - MCP endpoint (port 8000)</li>
            </ul>
            
            <h2>🛠️ MCP Tools Available</h2>
            <ul>
              <li><code>search_records</code> - Search records in any CRM module</li>
              <li><code>get_record</code> - Get specific record by ID</li>
              <li><code>list_modules</code> - List all available CRM modules</li>
              <li><code>get_module_fields</code> - Get field metadata for a module</li>
              <li><code>health_check</code> - Test CRM API connectivity</li>
            </ul>
          </body>
        </html>
      `);
    });

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        const startTime = Date.now();
        const crmTest = await zohoCRMClient.testConnection();
        const duration = Date.now() - startTime;
        
        const healthData = {
          status: crmTest.success ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '1.0.0',
          response_time_ms: duration,
          zoho_crm_api: crmTest.success ? 'ok' : 'error',
          zoho_message: crmTest.success 
            ? 'API connection successful'
            : (crmTest.error || 'API connection failed'),
        };

        res.json(healthData);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Start Express server for OAuth
    const expressPort = config.server.port + 1; // Use port 8001 for OAuth
    app.listen(expressPort, () => {
      logger.info(`OAuth server started on port ${expressPort}`);
      logger.info(`OAuth authorization URL: http://localhost:${expressPort}/oauth/authorize`);
    });

    // Create FastMCP server instance
    const server = new FastMCP({
      name: config.mcp.serverName,
      version: '1.0.0', // FastMCP expects semver format
      instructions: `
This is a Zoho CRM MCP server that provides tools for interacting with Zoho CRM API.

Available tools include:
- search_records: Search records in any CRM module with criteria, pagination, and sorting
- get_record: Get a specific record by ID from any module
- list_modules: List all available CRM modules
- get_module_fields: Get field metadata for a specific module
- health_check: Test CRM API connectivity

The server automatically handles authentication using OAuth 2.0 with refresh tokens.
All API responses include comprehensive data with proper error handling.
      `.trim(),
    });

    // Add search_records tool
    server.addTool({
      name: 'search_records',
      description: 'Search records in any Zoho CRM module with criteria, pagination, and sorting',
      parameters: z.object({
        module: z.string().describe('CRM module name (e.g., Leads, Contacts, Accounts, Deals)'),
        criteria: z.string().optional().describe('Search criteria in format "field:value"'),
        page: z.number().int().min(1).default(1).describe('Page number for pagination'),
        per_page: z.number().int().min(1).max(200).default(25).describe('Number of records per page (max 200)'),
        sort_by: z.string().optional().describe('Field to sort by'),
        sort_order: z.enum(['asc', 'desc']).default('asc').describe('Sort order'),
        fields: z.array(z.string()).optional().describe('Specific fields to return')
      }),
      execute: async (params) => {
        try {
          const result = await zohoCRMClient.searchRecords(params as any);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          return `Search records failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Add get_record tool
    server.addTool({
      name: 'get_record',
      description: 'Get a specific record by ID from any Zoho CRM module',
      parameters: z.object({
        module: z.string().describe('CRM module name (e.g., Leads, Contacts, Accounts, Deals)'),
        record_id: z.string().describe('Record ID to retrieve'),
        fields: z.array(z.string()).optional().describe('Specific fields to return')
      }),
      execute: async (params) => {
        try {
          const result = await zohoCRMClient.getRecord(params as any);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          return `Get record failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Add list_modules tool
    server.addTool({
      name: 'list_modules',
      description: 'List all available Zoho CRM modules',
      parameters: z.object({
        type: z.enum(['all', 'custom', 'standard']).default('all').describe('Type of modules to list')
      }),
      execute: async (params) => {
        try {
          const result = await zohoCRMClient.listModules(params);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          return `List modules failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Add get_module_fields tool
    server.addTool({
      name: 'get_module_fields',
      description: 'Get field metadata for a specific CRM module',
      parameters: z.object({
        module: z.string().describe('CRM module name (e.g., Leads, Contacts, Accounts, Deals)')
      }),
      execute: async (params) => {
        try {
          const result = await zohoCRMClient.getModuleFields(params as any);
          return JSON.stringify(result, null, 2);
        } catch (error) {
          return `Get module fields failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Add health check tool
    server.addTool({
      name: 'health_check',
      description: 'Check the health status of the server and Zoho CRM API connection',
      parameters: z.object({}),
      execute: async () => {
        try {
          const startTime = Date.now();
          
          // Test Zoho CRM API connection
          const crmTest = await zohoCRMClient.testConnection();
          
          // Check memory usage
          const memoryUsage = process.memoryUsage();
          const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
          
          const duration = Date.now() - startTime;
          
          const healthData = {
            status: crmTest.success ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            memory_usage_mb: Math.round(memoryUsageMB * 100) / 100,
            response_time_ms: duration,
            zoho_crm_api: crmTest.success ? 'ok' : 'error',
            zoho_message: crmTest.success 
              ? 'API connection successful'
              : (crmTest.error || 'API connection failed'),
          };

          return JSON.stringify(healthData, null, 2);
        } catch (error) {
          return `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Handle server events
    server.on('connect', (event) => {
      logger.info('Client connected', { sessionId: event.session });
    });

    server.on('disconnect', (event) => {
      logger.info('Client disconnected', { sessionId: event.session });
    });

    // Start the server
    const port = config.server.port;
    
    logger.info(`Starting FastMCP server on port ${port}`);
    
    await server.start({
      transportType: 'httpStream',
      httpStream: {
        port,
      },
    });

    logger.info(`FastMCP server started successfully on port ${port}`);
    logger.info('Endpoints available:');
    logger.info(`  - Claude Desktop: http://localhost:${port}/mcp`);
    logger.info(`  - Health Check: http://localhost:${port}/health`);

  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
