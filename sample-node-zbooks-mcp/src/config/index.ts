/**
 * Configuration Management for Zoho Books MCP Server
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';
import { ConfigurationError, type EnvironmentConfig } from '../types/index.js';

// Load environment variables
dotenvConfig();

// Zod schema for environment validation
const envSchema = z.object({
  // Zoho API Configuration
  ZOHO_CLIENT_ID: z.string().min(1, 'ZOHO_CLIENT_ID is required'),
  ZOHO_CLIENT_SECRET: z.string().min(1, 'ZOHO_CLIENT_SECRET is required'),
  ZOHO_REFRESH_TOKEN: z.string().min(1, 'ZOHO_REFRESH_TOKEN is required'),
  ZOHO_ORGANIZATION_ID: z.string().min(1, 'ZOHO_ORGANIZATION_ID is required'),
  ZOHO_PROJECTS_PORTAL_ID: z.string().min(1, 'ZOHO_PROJECTS_PORTAL_ID is required'),
  ZOHO_REGION: z.string().default('com'),
  ZOHO_API_BASE_URL: z.string().url().default('https://www.zohoapis.com'),

  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('8000'),
  HOST: z.string().default('0.0.0.0'),

  // MCP Server Configuration
  MCP_SERVER_NAME: z.string().default('Zoho Books MCP Server (Node.js)'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().optional(),

  // CORS Configuration
  CORS_ORIGINS: z.string().default('*'),
  CORS_CREDENTIALS: z.string().transform(Boolean).default('true'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),

  // Health Check Configuration
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).pipe(z.number().int().positive()).default('30000'),
  HEALTH_CHECK_TIMEOUT: z.string().transform(Number).pipe(z.number().int().positive()).default('5000'),

  // SSL Configuration
  SSL_ENABLED: z.string().transform(Boolean).default('false'),
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),

  // Monitoring
  ENABLE_METRICS: z.string().transform(Boolean).default('true'),
  METRICS_PORT: z.string().transform(Number).pipe(z.number().int().min(1).max(65535)).default('9090'),
});

/**
 * Validate and parse environment variables
 */
function validateEnvironment(): EnvironmentConfig {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Additional validations
    if (parsed.SSL_ENABLED && (!parsed.SSL_CERT_PATH || !parsed.SSL_KEY_PATH)) {
      throw new ConfigurationError(
        'SSL_CERT_PATH and SSL_KEY_PATH are required when SSL_ENABLED is true'
      );
    }

    return parsed as EnvironmentConfig;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue: z.ZodIssue) => 
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ');
      
      throw new ConfigurationError(
        `Environment validation failed: ${issues}`,
        { zodError: error.issues }
      );
    }
    throw error;
  }
}

/**
 * Application configuration singleton
 */
class Config {
  private static instance: Config;
  private _env: EnvironmentConfig;

  private constructor() {
    this._env = validateEnvironment();
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get env(): EnvironmentConfig {
    return this._env;
  }

  /**
   * Get Zoho API configuration
   */
  get zoho() {
    return {
      clientId: this._env.ZOHO_CLIENT_ID,
      clientSecret: this._env.ZOHO_CLIENT_SECRET,
      refreshToken: this._env.ZOHO_REFRESH_TOKEN,
      organizationId: this._env.ZOHO_ORGANIZATION_ID,
      projectsPortalId: this._env.ZOHO_PROJECTS_PORTAL_ID,
      region: this._env.ZOHO_REGION,
      baseUrl: this._env.ZOHO_API_BASE_URL,
    };
  }

  /**
   * Get server configuration
   */
  get server() {
    return {
      nodeEnv: this._env.NODE_ENV,
      port: this._env.PORT,
      host: this._env.HOST,
      corsOrigins: this._env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
      corsCredentials: this._env.CORS_CREDENTIALS,
      sslEnabled: this._env.SSL_ENABLED,
      sslCertPath: this._env.SSL_CERT_PATH,
      sslKeyPath: this._env.SSL_KEY_PATH,
    };
  }

  /**
   * Get MCP server configuration
   */
  get mcp() {
    return {
      serverName: this._env.MCP_SERVER_NAME,
      serverVersion: this._env.MCP_SERVER_VERSION,
    };
  }

  /**
   * Get logging configuration
   */
  get logging() {
    return {
      level: this._env.LOG_LEVEL,
      file: this._env.LOG_FILE,
    };
  }

  /**
   * Get rate limiting configuration
   */
  get rateLimit() {
    return {
      windowMs: this._env.RATE_LIMIT_WINDOW_MS,
      maxRequests: this._env.RATE_LIMIT_MAX_REQUESTS,
    };
  }

  /**
   * Get health check configuration
   */
  get healthCheck() {
    return {
      interval: this._env.HEALTH_CHECK_INTERVAL,
      timeout: this._env.HEALTH_CHECK_TIMEOUT,
    };
  }

  /**
   * Get monitoring configuration
   */
  get monitoring() {
    return {
      enabled: this._env.ENABLE_METRICS,
      port: this._env.METRICS_PORT,
    };
  }

  /**
   * Check if running in development mode
   */
  get isDevelopment(): boolean {
    return this._env.NODE_ENV === 'development';
  }

  /**
   * Check if running in production mode
   */
  get isProduction(): boolean {
    return this._env.NODE_ENV === 'production';
  }

  /**
   * Check if running in test mode
   */
  get isTest(): boolean {
    return this._env.NODE_ENV === 'test';
  }

  /**
   * Validate configuration at startup
   */
  validate(): void {
    // Additional runtime validations can be added here
    if (this.isProduction && this._env.LOG_LEVEL === 'debug') {
      console.warn('Warning: Debug logging enabled in production');
    }

    if (this.server.corsOrigins.includes('*') && this.isProduction) {
      console.warn('Warning: CORS configured to allow all origins in production');
    }
  }

  /**
   * Get configuration summary for logging
   */
  getSummary(): Record<string, unknown> {
    return {
      nodeEnv: this._env.NODE_ENV,
      port: this._env.PORT,
      host: this._env.HOST,
      logLevel: this._env.LOG_LEVEL,
      mcpServerName: this._env.MCP_SERVER_NAME,
      mcpServerVersion: this._env.MCP_SERVER_VERSION,
      zohoRegion: this._env.ZOHO_REGION,
      sslEnabled: this._env.SSL_ENABLED,
      metricsEnabled: this._env.ENABLE_METRICS,
    };
  }
}

// Export singleton instance
export const config = Config.getInstance();

// Export additional utilities
export { ConfigurationError } from '../types/index.js';

/**
 * Utility function to check if all required environment variables are set
 */
export function checkRequiredEnvVars(): void {
  const required = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET', 
    'ZOHO_REFRESH_TOKEN',
    'ZOHO_ORGANIZATION_ID',
    'ZOHO_PROJECTS_PORTAL_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new ConfigurationError(
      `Missing required environment variables: ${missing.join(', ')}.
      
Please ensure you have:
1. Copied env.example to .env
2. Filled in all required Zoho API credentials
3. Set your organization ID

Required variables:
${required.map(key => `  - ${key}`).join('\n')}
`
    );
  }
} 