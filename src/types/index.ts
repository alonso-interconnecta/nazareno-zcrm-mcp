/**
 * Zoho CRM MCP Server - Type Definitions
 */

// ===== Environment Configuration =====
export interface EnvironmentConfig {
  // Zoho CRM API Configuration
  ZOHO_CLIENT_ID?: string;
  ZOHO_CLIENT_SECRET?: string;
  ZOHO_REFRESH_TOKEN?: string;
  ZOHO_ACCESS_TOKEN?: string;
  ZOHO_TOKEN_EXPIRES_AT?: string;
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

// ===== Zoho CRM API Types =====
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
  info?: {
    count?: number;
    page?: number;
    per_page?: number;
    more_records?: boolean;
  };
}

// ===== CRM Module Types =====
export type CRMModule = 
  | 'Leads' | 'Contacts' | 'Accounts' | 'Deals' | 'Tasks' | 'Calls' | 'Meetings' | 'Events'
  | 'Products' | 'Quotes' | 'Sales_Orders' | 'Purchase_Orders' | 'Invoices'
  | 'Vendors' | 'Price_Books' | 'Campaigns' | 'Cases' | 'Solutions' | 'Notes';

// ===== Common Types =====
export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: SortOrder;
}

export interface SearchCriteria {
  criteria?: string;
  fields?: string[];
}

// ===== CRM Record Types =====
export interface CRMRecord {
  id: string;
  [key: string]: unknown;
}

export interface CRMRecordList {
  records: CRMRecord[];
  info: {
    count: number;
    page: number;
    per_page: number;
    more_records: boolean;
  };
}

// ===== Lead Types =====
export interface Lead {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Full_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Company?: string;
  Designation?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Industry?: string;
  Annual_Revenue?: number;
  No_of_Employees?: number;
  Rating?: string;
  Website?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Contact Types =====
export interface Contact {
  id: string;
  First_Name?: string;
  Last_Name?: string;
  Full_Name?: string;
  Email?: string;
  Phone?: string;
  Mobile?: string;
  Account_Name?: {
    name: string;
    id: string;
  };
  Title?: string;
  Department?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Account Types =====
export interface Account {
  id: string;
  Account_Name?: string;
  Website?: string;
  Phone?: string;
  Industry?: string;
  Annual_Revenue?: number;
  No_of_Employees?: number;
  Rating?: string;
  Billing_Street?: string;
  Billing_City?: string;
  Billing_State?: string;
  Billing_Code?: string;
  Billing_Country?: string;
  Shipping_Street?: string;
  Shipping_City?: string;
  Shipping_State?: string;
  Shipping_Code?: string;
  Shipping_Country?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Deal Types =====
export interface Deal {
  id: string;
  Deal_Name?: string;
  Account_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Amount?: number;
  Closing_Date?: string;
  Stage?: string;
  Type?: string;
  Lead_Source?: string;
  Next_Step?: string;
  Description?: string;
  Probability?: number;
  Expected_Revenue?: number;
  Campaign_Source?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Task Types =====
export interface Task {
  id: string;
  Subject?: string;
  Status?: string;
  Priority?: string;
  Due_Date?: string;
  Description?: string;
  What_Id?: {
    name: string;
    id: string;
  };
  Who_Id?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Call Types =====
export interface Call {
  id: string;
  Subject?: string;
  Call_Type?: string;
  Call_Start_Time?: string;
  Call_Duration?: number;
  Call_Result?: string;
  Description?: string;
  What_Id?: {
    name: string;
    id: string;
  };
  Who_Id?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Meeting Types =====
export interface Meeting {
  id: string;
  Subject?: string;
  Start_DateTime?: string;
  End_DateTime?: string;
  Venue?: string;
  Description?: string;
  What_Id?: {
    name: string;
    id: string;
  };
  Who_Id?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Product Types =====
export interface Product {
  id: string;
  Product_Name?: string;
  Product_Code?: string;
  Product_Active?: boolean;
  Unit_Price?: number;
  Commission_Rate?: number;
  Tax?: {
    name: string;
    id: string;
  };
  Category?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Quote Types =====
export interface Quote {
  id: string;
  Subject?: string;
  Quote_Stage?: string;
  Valid_Till?: string;
  Billing_Address?: string;
  Shipping_Address?: string;
  Customer_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Deal_Name?: {
    name: string;
    id: string;
  };
  Sub_Total?: number;
  Tax?: number;
  Total?: number;
  Terms_Conditions?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Sales Order Types =====
export interface SalesOrder {
  id: string;
  Subject?: string;
  Sales_Order_Number?: string;
  Customer_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Deal_Name?: {
    name: string;
    id: string;
  };
  Quote_Name?: {
    name: string;
    id: string;
  };
  Due_Date?: string;
  Billing_Address?: string;
  Shipping_Address?: string;
  Sub_Total?: number;
  Tax?: number;
  Total?: number;
  Status?: string;
  Terms_Conditions?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Invoice Types =====
export interface Invoice {
  id: string;
  Subject?: string;
  Invoice_Number?: string;
  Customer_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Deal_Name?: {
    name: string;
    id: string;
  };
  Quote_Name?: {
    name: string;
    id: string;
  };
  Sales_Order_Name?: {
    name: string;
    id: string;
  };
  Due_Date?: string;
  Billing_Address?: string;
  Shipping_Address?: string;
  Sub_Total?: number;
  Tax?: number;
  Total?: number;
  Balance?: number;
  Status?: string;
  Terms_Conditions?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Campaign Types =====
export interface Campaign {
  id: string;
  Campaign_Name?: string;
  Type?: string;
  Status?: string;
  Start_Date?: string;
  End_Date?: string;
  Expected_Revenue?: number;
  Budgeted_Cost?: number;
  Actual_Cost?: number;
  Expected_Response?: number;
  Num_sent?: number;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Case Types =====
export interface Case {
  id: string;
  Subject?: string;
  Case_Number?: string;
  Account_Name?: {
    name: string;
    id: string;
  };
  Contact_Name?: {
    name: string;
    id: string;
  };
  Product_Name?: {
    name: string;
    id: string;
  };
  Priority?: string;
  Type?: string;
  Status?: string;
  Reason?: string;
  Origin?: string;
  Description?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Solution Types =====
export interface Solution {
  id: string;
  Solution_Title?: string;
  Product_Name?: {
    name: string;
    id: string;
  };
  Status?: string;
  Owner?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  [key: string]: unknown;
}

// ===== Note Types =====
export interface Note {
  id: string;
  Note_Title?: string;
  Note_Content?: string;
  Parent_Id?: {
    name: string;
    id: string;
  };
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    name: string;
    id: string;
  };
  [key: string]: unknown;
}

// ===== Module Metadata Types =====
export interface CRMModuleInfo {
  api_name: string;
  display_name: string;
  module_id: string;
  module: string;
  sequence_number: number;
  singular_label: string;
  plural_label: string;
  viewable: boolean;
  creatable: boolean;
  editable: boolean;
  deletable: boolean;
  web_link: string;
  api_supported: boolean;
  primary: boolean;
  modified_name: string;
  generated_type: number;
  business_card_field_limit: number;
  profiles: Array<{
    name: string;
    id: string;
  }>;
  custom_view: {
    id: string;
    name: string;
  };
  global_search_supported: boolean;
}

export interface CRMFieldInfo {
  api_name: string;
  data_type: string;
  length: number;
  decimal_place?: number;
  sequence_number: number;
  default_value?: string;
  pick_list_values?: Array<{
    display_value: string;
    actual_value: string;
  }>;
  lookup?: {
    module: string;
    id: string;
  };
  required: boolean;
  system_mandatory: boolean;
  unique: {
    casesensitive: boolean;
  };
  virtual_field: boolean;
  field_read_only: boolean;
  custom_field: boolean;
  visible: boolean;
  display_label: string;
  [key: string]: unknown;
}

// ===== Search Parameters =====
export interface SearchRecordsParams extends PaginationParams, SearchCriteria {
  module: CRMModule;
}

export interface GetRecordParams {
  module: CRMModule;
  record_id: string;
  fields?: string[];
}

export interface ListModulesParams {
  type?: 'all' | 'custom' | 'standard';
}

export interface GetModuleFieldsParams {
  module: CRMModule;
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
    zoho_crm_api: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'critical';
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
