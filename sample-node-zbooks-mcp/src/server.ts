#!/usr/bin/env node
/**
 * Zoho Books MCP Server - Node.js TypeScript Implementation
 * Using FastMCP framework for automatic SSE transport handling
 */

import { FastMCP } from 'fastmcp';
import { config, checkRequiredEnvVars } from './config/index.js';
import { logger } from './utils/logger.js';
import { zohoBooksClient } from './utils/zoho-client.js';
import { z } from 'zod';

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Check environment variables
    checkRequiredEnvVars();
    
    // Validate configuration
    config.validate();
    
    logger.info('Starting Zoho Books MCP Server with FastMCP', config.getSummary());

    // Create FastMCP server instance
    const server = new FastMCP({
      name: config.mcp.serverName,
      version: '1.0.0', // FastMCP expects semver format
      instructions: `
This is a Zoho Books MCP server that provides tools for interacting with Zoho Books API.

Available tools include:
- Invoice management (list, create, update, delete)
- Contact management (list, create, update)
- Item management (list, create, update)
- Expense management (list, create, update)
- Sales order management (list, create, update)

The server automatically handles authentication using OAuth 2.0 with refresh tokens.
All API responses include comprehensive data with proper error handling.
      `.trim(),
    });

    // Add a simple test tool
    server.addTool({
      name: 'test_connection',
      description: 'Test the connection to Zoho Books API',
      parameters: z.object({}),
      execute: async () => {
        try {
          const testResult = await zohoBooksClient.testConnection();
          const message = testResult.success 
            ? 'Connection test completed successfully'
            : (testResult.error || 'Connection test failed');
          
          return JSON.stringify({
            success: testResult.success,
            message,
            timestamp: new Date().toISOString(),
            organization: testResult.success ? testResult.organization : undefined,
          }, null, 2);
        } catch (error) {
          return `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    });

    // Add health check tool
    server.addTool({
      name: 'health_check',
      description: 'Check the health status of the server and Zoho API connection',
      parameters: z.object({}),
      execute: async () => {
        try {
          const startTime = Date.now();
          
          // Test Zoho API connection
          const zohoTest = await zohoBooksClient.testConnection();
          
          // Check memory usage
          const memoryUsage = process.memoryUsage();
          const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
          
          const duration = Date.now() - startTime;
          
          const healthData = {
            status: zohoTest.success ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            memory_usage_mb: Math.round(memoryUsageMB * 100) / 100,
            response_time_ms: duration,
            zoho_api: zohoTest.success ? 'ok' : 'error',
            zoho_message: zohoTest.success 
              ? 'API connection successful'
              : (zohoTest.error || 'API connection failed'),
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
    logger.info(`  - Claude Desktop: https://zbooks-mcp-node.interconnecta.ai/mcp`);
    logger.info(`  - Health Check: https://zbooks-mcp-node.interconnecta.ai/health`);

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