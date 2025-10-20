/**
 * Zoho CRM API Client
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { config } from '../config/index.js';
import { logger } from './logger.js';
import { 
  ZohoApiClientError, 
  type ZohoAuthTokens, 
  type ZohoApiResponse,
  type CRMModule,
  type CRMRecord,
  type CRMRecordList,
  type CRMModuleInfo,
  type CRMFieldInfo,
  type SearchRecordsParams,
  type GetRecordParams,
  type ListModulesParams,
  type GetModuleFieldsParams
} from '../types/index.js';

/**
 * Zoho CRM API Client Class
 */
export class ZohoCRMClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    const baseURL = `${config.zoho.baseUrl}/crm/v3`;
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Load existing tokens from tokens.json if available
    this.loadStoredTokens();

    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        if (this.accessToken) {
          config.headers.Authorization = `Zoho-oauthtoken ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          throw new ZohoApiClientError(
            data.message || `HTTP ${status} error`,
            status,
            { response: data, url: error.config?.url }
          );
        }
        throw new ZohoApiClientError(
          error.message || 'Network error',
          500,
          { originalError: error }
        );
      }
    );
  }

  /**
   * Load stored tokens from tokens.json file
   */
  private async loadStoredTokens(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      const tokensData = await fs.readFile(tokensPath, 'utf-8');
      const tokens = JSON.parse(tokensData);
      
      this.accessToken = tokens.access_token || null;
      if (tokens.expires_at) {
        this.tokenExpiresAt = new Date(tokens.expires_at);
      }
      
      logger.info('Loaded tokens from tokens.json file');
    } catch (error) {
      logger.warn('Could not load tokens from tokens.json file:', error);
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    // If we have a token that's still valid (with 5 minute buffer), use it
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return;
    }

    // If we have a refresh token, use it to get a new access token
    if (config.zoho.refreshToken) {
      await this.refreshAccessToken();
    } else {
      throw new ZohoApiClientError(
        'No valid access token or refresh token available. Please complete OAuth flow.',
        401,
        { message: 'OAuth flow required' }
      );
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const tokenUrl = `https://accounts.zoho.${config.zoho.region}/oauth/v2/token`;
      
      const response = await axios.post(tokenUrl, null, {
        params: {
          refresh_token: config.zoho.refreshToken,
          client_id: config.zoho.clientId,
          client_secret: config.zoho.clientSecret,
          grant_type: 'refresh_token',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokens: ZohoAuthTokens = response.data;
      this.accessToken = tokens.access_token;
      
      // Set expiration time (subtract 5 minutes for buffer)
      const expiresInMs = (tokens.expires_in - 300) * 1000;
      this.tokenExpiresAt = new Date(Date.now() + expiresInMs);
      
      // Update .env file with new tokens
      await this.updateEnvTokens(tokens);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ZohoApiClientError(
        `Failed to refresh access token: ${errorMessage}`,
        401,
        { originalError: error }
      );
    }
  }

  /**
   * Update tokens.json file with new tokens
   */
  private async updateEnvTokens(tokens: ZohoAuthTokens): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      
      // Create tokens object with expiration
      const tokenData = {
        refresh_token: config.zoho.refreshToken,
        access_token: tokens.access_token,
        expires_at: this.tokenExpiresAt?.toISOString() || '',
        created_at: new Date().toISOString(),
        token_type: tokens.token_type || 'Bearer'
      };

      // Write tokens to JSON file
      await fs.writeFile(tokensPath, JSON.stringify(tokenData, null, 2), 'utf-8');
      
      logger.info('Tokens updated in tokens.json file');
      
    } catch (error) {
      logger.warn('Could not update tokens.json file with new tokens:', error);
    }
  }

  /**
   * Make a GET request to the Zoho CRM API
   */
  private async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ZohoApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params,
    };

    const response: AxiosResponse<ZohoApiResponse<T>> = await this.axiosInstance.get(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Get Zoho configuration
   */
  private get zoho() {
    return config.zoho;
  }

  // ===== Core CRM Methods =====

  /**
   * Search records in a CRM module
   */
  async searchRecords(params: SearchRecordsParams): Promise<CRMRecordList> {
    const { module, criteria, page = 1, per_page = 25, sort_by, sort_order = 'asc', fields } = params;
    
    const apiParams: Record<string, unknown> = {
      page,
      per_page: Math.min(per_page, 200), // Max 200 per page
    };

    // Add criteria if provided
    if (criteria) {
      apiParams.criteria = criteria;
    }

    // Add sorting if provided
    if (sort_by) {
      apiParams.sort_by = sort_by;
      apiParams.sort_order = sort_order;
    }

    // Add field selection if provided
    if (fields && fields.length > 0) {
      apiParams.fields = fields.join(',');
    }

    const response = await this.get<CRMRecordList>(`/${module}`, apiParams);
    
    if (!response.data) {
      throw new ZohoApiClientError('No data returned from search records API');
    }

    return response.data;
  }

  /**
   * Get a specific record by ID
   */
  async getRecord(params: GetRecordParams): Promise<CRMRecord> {
    const { module, record_id, fields } = params;
    
    const apiParams: Record<string, unknown> = {};

    // Add field selection if provided
    if (fields && fields.length > 0) {
      apiParams.fields = fields.join(',');
    }

    const response = await this.get<CRMRecord>(`/${module}/${record_id}`, apiParams);
    
    if (!response.data) {
      throw new ZohoApiClientError('No data returned from get record API');
    }

    return response.data;
  }

  /**
   * List all available CRM modules
   */
  async listModules(params: ListModulesParams = {}): Promise<CRMModuleInfo[]> {
    const { type = 'all' } = params;
    
    const apiParams: Record<string, unknown> = {};
    if (type !== 'all') {
      apiParams.type = type;
    }

    const response = await this.get<CRMModuleInfo[]>('/settings/modules', apiParams);
    
    if (!response.data) {
      throw new ZohoApiClientError('No data returned from list modules API');
    }

    return response.data;
  }

  /**
   * Get fields for a specific module
   */
  async getModuleFields(params: GetModuleFieldsParams): Promise<CRMFieldInfo[]> {
    const { module } = params;
    
    const response = await this.get<CRMFieldInfo[]>(`/settings/fields`, {
      module,
    });
    
    if (!response.data) {
      throw new ZohoApiClientError('No data returned from get module fields API');
    }

    return response.data;
  }

  // ===== Health Check Method =====

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.get('/users?type=CurrentUser');
      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const zohoCRMClient = new ZohoCRMClient();
