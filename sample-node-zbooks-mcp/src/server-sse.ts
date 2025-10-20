#!/usr/bin/env node
/**
 * Zoho Books MCP Server - Node.js TypeScript Implementation
 * Using custom SSE implementation for Claude Desktop compatibility
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import cors from 'cors';
import { config, checkRequiredEnvVars } from './config/index.js';
import { logger } from './utils/logger.js';
import { zohoBooksClient } from './utils/zoho-client.js';

/**
 * MCP Server Implementation with proper SSE support
 */
class ZohoBooksMCPServer {
  private mcpServer: Server;
  private app: express.Application;
  private activeTransport: SSEServerTransport | null = null;

  constructor() {
    this.mcpServer = new Server({
      name: config.mcp.serverName,
      version: config.mcp.serverVersion,
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.app = express();
    this.setupMCPHandlers();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMCPHandlers(): void {
    // List tools handler
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Health and Testing Tools
          {
            name: 'test_connection',
            description: 'Test the connection to Zoho Books API',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          {
            name: 'health_check',
            description: 'Check the health status of the server and Zoho API connection',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          // Invoice Tools
          {
            name: 'list_invoices_tool',
            description: 'List invoices with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number', default: 1 },
                page_size: { type: 'number', description: 'Items per page', default: 25 },
                status: { type: 'string', description: 'Filter by status' },
                customer_id: { type: 'string', description: 'Filter by customer ID' },
                date_range_start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                date_range_end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                search_text: { type: 'string', description: 'Search text' },
                sort_column: { type: 'string', description: 'Column to sort by' },
                sort_order: { type: 'string', description: 'Sort order' },
              },
              required: [],
            },
          },
          {
            name: 'get_invoice_tool',
            description: 'Get details of a specific invoice',
            inputSchema: {
              type: 'object',
              properties: {
                invoice_id: { type: 'string', description: 'Invoice ID' },
              },
              required: ['invoice_id'],
            },
          },
          {
            name: 'create_invoice_tool',
            description: 'Create a new invoice',
            inputSchema: {
              type: 'object',
              properties: {
                customer_id: { type: 'string', description: 'Customer ID' },
                line_items: { type: 'string', description: 'JSON string of line items' },
                invoice_number: { type: 'string', description: 'Custom invoice number' },
                invoice_date: { type: 'string', description: 'Invoice date (YYYY-MM-DD)' },
                due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
                notes: { type: 'string', description: 'Notes' },
                terms: { type: 'string', description: 'Terms and conditions' },
              },
              required: ['customer_id', 'line_items'],
            },
          },
          // Contact Tools
          {
            name: 'list_contacts_tool',
            description: 'List contacts with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                contact_type: { type: 'string', description: 'Type filter', default: 'all' },
                page: { type: 'number', description: 'Page number', default: 1 },
                page_size: { type: 'number', description: 'Items per page', default: 25 },
                search_text: { type: 'string', description: 'Search text' },
                status: { type: 'string', description: 'Status filter', default: 'active' },
                sort_column: { type: 'string', description: 'Sort column', default: 'contact_name' },
                sort_order: { type: 'string', description: 'Sort order', default: 'ascending' },
              },
              required: [],
            },
          },
          {
            name: 'get_contact_tool',
            description: 'Get details of a specific contact',
            inputSchema: {
              type: 'object',
              properties: {
                contact_id: { type: 'string', description: 'Contact ID' },
              },
              required: ['contact_id'],
            },
          },
          // Expense Tools
          {
            name: 'list_expenses_tool',
            description: 'List expenses with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number', default: 1 },
                page_size: { type: 'number', description: 'Items per page', default: 25 },
                status: { type: 'string', description: 'Filter by status' },
                vendor_id: { type: 'string', description: 'Filter by vendor ID' },
                date_range_start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                date_range_end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                search_text: { type: 'string', description: 'Search text' },
                sort_column: { type: 'string', description: 'Sort column', default: 'date' },
                sort_order: { type: 'string', description: 'Sort order', default: 'ascending' },
              },
              required: [],
            },
          },
          {
            name: 'get_expense_tool',
            description: 'Get details of a specific expense',
            inputSchema: {
              type: 'object',
              properties: {
                expense_id: { type: 'string', description: 'Expense ID' },
              },
              required: ['expense_id'],
            },
          },
          {
            name: 'create_expense_tool',
            description: 'Create a new expense',
            inputSchema: {
              type: 'object',
              properties: {
                account_id: { type: 'string', description: 'Expense account ID' },
                date: { type: 'string', description: 'Expense date (YYYY-MM-DD)' },
                amount: { type: 'number', description: 'Expense amount' },
                paid_through_account_id: { type: 'string', description: 'Payment account ID' },
                vendor_id: { type: 'string', description: 'Vendor ID' },
                is_billable: { type: 'boolean', description: 'Is billable to customer', default: false },
                customer_id: { type: 'string', description: 'Customer ID if billable' },
                description: { type: 'string', description: 'Expense description' },
                reference_number: { type: 'string', description: 'Reference number' },
              },
              required: ['account_id', 'date', 'amount', 'paid_through_account_id'],
            },
          },
          // Item Tools
          {
            name: 'list_items_tool',
            description: 'List items (products and services) with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number', default: 1 },
                page_size: { type: 'number', description: 'Items per page', default: 25 },
                item_type: { type: 'string', description: 'Filter by item type' },
                search_text: { type: 'string', description: 'Search text' },
                status: { type: 'string', description: 'Filter by status' },
                sort_column: { type: 'string', description: 'Sort column', default: 'name' },
                sort_order: { type: 'string', description: 'Sort order', default: 'ascending' },
              },
              required: [],
            },
          },
          {
            name: 'get_item_tool',
            description: 'Get details of a specific item',
            inputSchema: {
              type: 'object',
              properties: {
                item_id: { type: 'string', description: 'Item ID' },
              },
              required: ['item_id'],
            },
          },
          {
            name: 'create_item_tool',
            description: 'Create a new item (product or service)',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Item name' },
                rate: { type: 'number', description: 'Item rate/price' },
                description: { type: 'string', description: 'Item description' },
                item_type: { type: 'string', description: 'Item type', default: 'service' },
                sku: { type: 'string', description: 'SKU' },
                unit: { type: 'string', description: 'Unit of measurement' },
              },
              required: ['name', 'rate'],
            },
          },
          {
            name: 'update_item_tool',
            description: 'Update an existing item',
            inputSchema: {
              type: 'object',
              properties: {
                item_id: { type: 'string', description: 'Item ID' },
                name: { type: 'string', description: 'Item name' },
                rate: { type: 'number', description: 'Item rate/price' },
                description: { type: 'string', description: 'Item description' },
                sku: { type: 'string', description: 'SKU' },
                unit: { type: 'string', description: 'Unit of measurement' },
              },
              required: ['item_id'],
            },
          },
          // Sales Tools
          {
            name: 'list_sales_orders_tool',
            description: 'List sales orders with optional filtering',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number', description: 'Page number', default: 1 },
                page_size: { type: 'number', description: 'Items per page', default: 25 },
                status: { type: 'string', description: 'Filter by status' },
                customer_id: { type: 'string', description: 'Filter by customer ID' },
                date_range_start: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
                date_range_end: { type: 'string', description: 'End date (YYYY-MM-DD)' },
                search_text: { type: 'string', description: 'Search text' },
                sort_column: { type: 'string', description: 'Sort column', default: 'salesorder_number' },
                sort_order: { type: 'string', description: 'Sort order', default: 'ascending' },
              },
              required: [],
            },
          },
          {
            name: 'get_sales_order_tool',
            description: 'Get details of a specific sales order',
            inputSchema: {
              type: 'object',
              properties: {
                sales_order_id: { type: 'string', description: 'Sales order ID' },
              },
              required: ['sales_order_id'],
            },
          },
        ],
      };
    });

    // Call tool handler
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Health and Testing Tools
          case 'test_connection':
            return await this.handleTestConnection();
          case 'health_check':
            return await this.handleHealthCheck();
          
          // Invoice Tools
          case 'list_invoices_tool':
            return await this.handleListInvoices(args);
          case 'get_invoice_tool':
            return await this.handleGetInvoice(args);
          case 'create_invoice_tool':
            return await this.handleCreateInvoice(args);
          
          // Contact Tools
          case 'list_contacts_tool':
            return await this.handleListContacts(args);
          case 'get_contact_tool':
            return await this.handleGetContact(args);
          
          // Expense Tools
          case 'list_expenses_tool':
            return await this.handleListExpenses(args);
          case 'get_expense_tool':
            return await this.handleGetExpense(args);
          case 'create_expense_tool':
            return await this.handleCreateExpense(args);
          
          // Item Tools
          case 'list_items_tool':
            return await this.handleListItems(args);
          case 'get_item_tool':
            return await this.handleGetItem(args);
          case 'create_item_tool':
            return await this.handleCreateItem(args);
          case 'update_item_tool':
            return await this.handleUpdateItem(args);
          
          // Sales Tools
          case 'list_sales_orders_tool':
            return await this.handleListSalesOrders(args);
          case 'get_sales_order_tool':
            return await this.handleGetSalesOrder(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool ${name} failed:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }],
          isError: true,
        };
      }
    });

    // Handle initialization
    this.mcpServer.oninitialized = async () => {
      logger.info('MCP server initialized successfully');
    };
  }

  private async handleTestConnection() {
    try {
      const testResult = await zohoBooksClient.testConnection();
      const message = testResult.success 
        ? 'Connection test completed successfully'
        : (testResult.error || 'Connection test failed');
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: testResult.success,
            message,
            timestamp: new Date().toISOString(),
            organization: testResult.success ? testResult.organization : undefined,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleHealthCheck() {
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
        version: config.mcp.serverVersion,
        memory_usage_mb: Math.round(memoryUsageMB * 100) / 100,
        response_time_ms: duration,
        zoho_api: zohoTest.success ? 'ok' : 'error',
        zoho_message: zohoTest.success 
          ? 'API connection successful'
          : (zohoTest.error || 'API connection failed'),
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(healthData, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  // ===== Invoice Handlers =====
  private async handleListInvoices(args: any) {
    try {
      const result = await zohoBooksClient.listInvoices(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleGetInvoice(args: any) {
    try {
      const result = await zohoBooksClient.getInvoice(args.invoice_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleCreateInvoice(args: any) {
    try {
      // Parse line_items if it's a string
      if (typeof args.line_items === 'string') {
        args.line_items = JSON.parse(args.line_items);
      }
      const result = await zohoBooksClient.createInvoice(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  // ===== Contact Handlers =====
  private async handleListContacts(args: any) {
    try {
      const result = await zohoBooksClient.listContacts(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleGetContact(args: any) {
    try {
      const result = await zohoBooksClient.getContact(args.contact_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  // ===== Expense Handlers =====
  private async handleListExpenses(args: any) {
    try {
      const result = await zohoBooksClient.listExpenses(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing expenses: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleGetExpense(args: any) {
    try {
      const result = await zohoBooksClient.getExpense(args.expense_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleCreateExpense(args: any) {
    try {
      const result = await zohoBooksClient.createExpense(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating expense: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  // ===== Item Handlers =====
  private async handleListItems(args: any) {
    try {
      const result = await zohoBooksClient.listItems(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleGetItem(args: any) {
    try {
      const result = await zohoBooksClient.getItem(args.item_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleCreateItem(args: any) {
    try {
      const result = await zohoBooksClient.createItem(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error creating item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleUpdateItem(args: any) {
    try {
      const result = await zohoBooksClient.updateItem(args.item_id, args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error updating item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  // ===== Sales Handlers =====
  private async handleListSalesOrders(args: any) {
    try {
      const result = await zohoBooksClient.listSalesOrders(args);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error listing sales orders: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private async handleGetSalesOrder(args: any) {
    try {
      const result = await zohoBooksClient.getSalesOrder(args.sales_order_id);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error getting sales order: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
        isError: true,
      };
    }
  }

  private setupMiddleware(): void {
    // CORS for cross-origin requests
    this.app.use(cors({
      origin: config.server.corsOrigins,
      credentials: config.server.corsCredentials,
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const result = await this.handleHealthCheck();
        const healthData = JSON.parse(result.content?.[0]?.text || '{}');
        res.status(healthData.status === 'healthy' ? 200 : 503).json(healthData);
      } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
      }
    });

    // SSE endpoint for Claude Desktop (via mcp-remote)
    this.app.get('/sse', async (req, res) => {
      logger.info('SSE GET request - establishing connection');
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      try {
        // Create SSE transport and connect to MCP server
        this.activeTransport = new SSEServerTransport('/sse', res);
        await this.mcpServer.connect(this.activeTransport);
        
        logger.info('SSE connection established and MCP server connected');
        
        req.on('close', () => {
          logger.info('SSE client disconnected');
          this.activeTransport = null;
        });

        req.on('error', () => {
          logger.info('SSE connection error');
          this.activeTransport = null;
        });

      } catch (error) {
        logger.error('SSE connection error:', error);
        this.activeTransport = null;
        res.end();
      }
    });

    // Handle SSE POST messages
    this.app.post('/sse', async (req, res) => {
      logger.info('SSE POST request received', { body: req.body });
      
      try {
        // If no active transport, create one for this POST request
        if (!this.activeTransport) {
          logger.info('Creating on-demand SSE transport for POST request');
          
          // Create a temporary transport for this POST request
          const transport = new SSEServerTransport('/sse', res);
          
          // Connect the MCP server to this transport
          await this.mcpServer.connect(transport);
          
          // Handle the POST message directly
          await transport.handlePostMessage(req, res, req.body);
          
          logger.info('On-demand SSE transport handled POST request');
          return;
        }

        // Use the existing transport to handle the POST message
        await this.activeTransport.handlePostMessage(req, res, req.body);
      } catch (error) {
        logger.error('SSE POST handling error:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: config.mcp.serverName,
        version: config.mcp.serverVersion,
        status: 'running',
        endpoints: {
          sse: '/sse',
          health: '/health',
        },
      });
    });
  }

  async start(): Promise<void> {
    const port = config.server.port;
    const host = config.server.host;

    return new Promise((resolve, reject) => {
      this.app.listen(port, host, () => {
        logger.info(`MCP server started on ${host}:${port}`);
        logger.info('Endpoints available:');
        logger.info(`  - Claude Desktop (SSE): https://zbooks-mcp-node.interconnecta.ai/sse`);
        logger.info(`  - Health Check: https://zbooks-mcp-node.interconnecta.ai/health`);
        resolve();
      });

      this.app.on('error', (error) => {
        logger.error('Server error:', error);
        reject(error);
      });
    });
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Check environment variables
    checkRequiredEnvVars();
    
    // Validate configuration
    config.validate();
    
    logger.info('Starting Zoho Books MCP Server with custom SSE implementation', config.getSummary());

    const server = new ZohoBooksMCPServer();
    await server.start();

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
} 