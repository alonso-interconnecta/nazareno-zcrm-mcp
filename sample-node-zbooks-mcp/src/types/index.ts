/**
 * Zoho Books MCP Server - Type Definitions
 */

// ===== Environment Configuration =====
export interface EnvironmentConfig {
  // Zoho API Configuration
  ZOHO_CLIENT_ID: string;
  ZOHO_CLIENT_SECRET: string;
  ZOHO_REFRESH_TOKEN: string;
  ZOHO_ORGANIZATION_ID: string;
  ZOHO_PROJECTS_PORTAL_ID: string;
  ZOHO_REGION: string;
  ZOHO_API_BASE_URL: string;

  // Server Configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;

  // MCP Server Configuration
  MCP_SERVER_NAME: string;
  MCP_SERVER_VERSION: string;

  // Logging Configuration
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FILE?: string;

  // CORS Configuration
  CORS_ORIGINS: string;
  CORS_CREDENTIALS: boolean;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: number;
  HEALTH_CHECK_TIMEOUT: number;

  // SSL Configuration
  SSL_ENABLED: boolean;
  SSL_CERT_PATH?: string;
  SSL_KEY_PATH?: string;

  // Monitoring
  ENABLE_METRICS: boolean;
  METRICS_PORT: number;
}

// ===== Zoho API Types =====
export interface ZohoAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface ZohoApiError {
  code: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ZohoApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  page_context?: {
    page: number;
    per_page: number;
    has_more_page: boolean;
    report_name: string;
    sort_column: string;
    sort_order: string;
  };
}

// ===== Common Types =====
export type SortOrder = 'A' | 'D' | 'ascending' | 'descending';

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_column?: string;
  sort_order?: SortOrder;
}

export interface DateRangeFilter {
  date_start?: string;
  date_end?: string;
}

// ===== Invoice Types =====
export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  status: 'draft' | 'sent' | 'viewed' | 'expired' | 'accepted' | 'declined' | 'invoiced';
  invoice_date: string;
  due_date: string;
  total: number;
  balance: number;
  created_time: string;
  last_modified_time: string;
  currency_code: string;
  line_items: InvoiceLineItem[];
  notes?: string;
  terms?: string;
}

export interface InvoiceLineItem {
  line_item_id?: string;
  item_id?: string;
  name: string;
  description?: string;
  rate: number;
  quantity: number;
  unit?: string;
  discount?: number;
  tax_id?: string;
  tax_name?: string;
  tax_type?: string;
  tax_percentage?: number;
  item_total: number;
}

export interface CreateInvoiceRequest {
  customer_id: string;
  line_items: InvoiceLineItem[];
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  notes?: string;
  terms?: string;
  discount?: number;
  tax_id?: string;
  currency_code?: string;
}

export interface InvoiceListParams extends PaginationParams, DateRangeFilter {
  customer_id?: string;
  status?: string;
  search_text?: string;
}

// ===== Contact Types =====
export interface Contact {
  contact_id: string;
  contact_name: string;
  company_name?: string;
  contact_type: 'customer' | 'vendor' | 'employee';
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  created_time: string;
  last_modified_time: string;
  billing_address?: Address;
  shipping_address?: Address;
  currency_code?: string;
  outstanding_receivable_amount?: number;
  outstanding_payable_amount?: number;
}

export interface Address {
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  fax?: string;
}

export interface CreateContactRequest {
  contact_name: string;
  contact_type: 'customer' | 'vendor';
  company_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  billing_address?: Partial<Address>;
  shipping_address?: Partial<Address>;
  currency_code?: string;
}

export interface ContactListParams extends PaginationParams {
  contact_type?: 'all' | 'customer' | 'vendor';
  status?: 'active' | 'inactive' | 'all';
  search_text?: string;
}

// ===== Item Types =====
export interface Item {
  item_id: string;
  name: string;
  description?: string;
  rate: number;
  unit?: string;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  item_type: 'service' | 'inventory';
  status: 'active' | 'inactive';
  source: string;
  is_linked_with_zoho_inventory: boolean;
  created_time: string;
  last_modified_time: string;
  sku?: string;
  purchase_rate?: number;
  purchase_account_id?: string;
  purchase_description?: string;
  inventory_account_id?: string;
  account_id?: string;
  initial_stock?: number;
  initial_stock_rate?: number;
}

export interface CreateItemRequest {
  name: string;
  rate: number;
  description?: string;
  item_type?: 'service' | 'inventory';
  sku?: string;
  unit?: string;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  purchase_rate?: number;
  purchase_account_id?: string;
  purchase_description?: string;
  inventory_account_id?: string;
  account_id?: string;
  initial_stock?: number;
  initial_stock_rate?: number;
}

export interface ItemListParams extends PaginationParams {
  search_text?: string;
  status?: 'active' | 'inactive' | 'all';
  item_type?: 'service' | 'inventory' | 'all';
}

// ===== Sales Order Types =====
export interface SalesOrder {
  salesorder_id: string;
  salesorder_number: string;
  customer_id: string;
  customer_name: string;
  status: 'draft' | 'open' | 'invoiced' | 'void';
  date: string;
  shipment_date?: string;
  total: number;
  created_time: string;
  last_modified_time: string;
  currency_code: string;
  line_items: SalesOrderLineItem[];
  notes?: string;
  terms?: string;
}

export interface SalesOrderLineItem {
  line_item_id?: string;
  item_id?: string;
  name: string;
  description?: string;
  rate: number;
  quantity: number;
  unit?: string;
  discount?: number;
  tax_id?: string;
  tax_name?: string;
  tax_percentage?: number;
  item_total: number;
}

export interface SalesOrderListParams extends PaginationParams, DateRangeFilter {
  customer_id?: string;
  status?: string;
  search_text?: string;
}

// ===== Expense Types =====
export interface Expense {
  expense_id: string;
  date: string;
  account_name: string;
  account_id: string;
  paid_through_account_id: string;
  paid_through_account_name: string;
  vendor_id?: string;
  vendor_name?: string;
  amount: number;
  tax_amount: number;
  total: number;
  is_billable: boolean;
  customer_id?: string;
  customer_name?: string;
  project_id?: string;
  project_name?: string;
  currency_code: string;
  exchange_rate: number;
  status: 'unbilled' | 'invoiced' | 'reimbursed' | 'non-billable';
  description?: string;
  reference_number?: string;
  created_time: string;
  last_modified_time: string;
}

export interface CreateExpenseRequest {
  account_id: string;
  date: string;
  amount: number;
  paid_through_account_id: string;
  vendor_id?: string;
  is_billable?: boolean;
  customer_id?: string;
  project_id?: string;
  currency_code?: string;
  exchange_rate?: number;
  tax_amount?: number;
  description?: string;
  reference_number?: string;
}

export interface ExpenseListParams extends PaginationParams, DateRangeFilter {
  vendor_id?: string;
  customer_id?: string;
  status?: string;
  search_text?: string;
}

// ===== MCP Tool Types =====
export interface McpToolParams {
  [key: string]: unknown;
}

export interface McpToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
  [key: string]: unknown;
}

// ===== Server Types =====
export interface ServerConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  enableMetrics: boolean;
  metricsPort: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  endpoints: string[];
  checks: {
    zoho_api: 'ok' | 'error';
    database?: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'critical';
    disk?: 'ok' | 'warning' | 'critical';
  };
}

// ===== Error Types =====
export class ZohoMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ZohoMcpError';
  }
}

export class ZohoApiClientError extends ZohoMcpError {
  constructor(message: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message, 'ZOHO_API_ERROR', statusCode, details);
    this.name = 'ZohoApiClientError';
  }
}

export class ConfigurationError extends ZohoMcpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
} 