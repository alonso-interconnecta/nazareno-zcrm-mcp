/**
 * Zoho Books API Client
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { config } from '../config/index.js';
import { 
  ZohoApiClientError, 
  type ZohoAuthTokens, 
  type ZohoApiResponse,
  type SortOrder
} from '../types/index.js';

/**
 * Zoho Books API Client Class
 */
export class ZohoBooksClient {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    const baseURL = `${config.zoho.baseUrl}/books/v3`;
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

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
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    // If we have a token that's still valid (with 5 minute buffer), use it
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return;
    }

    await this.refreshAccessToken();
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
   * Make a GET request to the Zoho API
   */
  private async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ZohoApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params: {
        organization_id: config.zoho.organizationId,
        ...params,
      },
    };

    const response: AxiosResponse<ZohoApiResponse<T>> = await this.axiosInstance.get(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Make a POST request to the Zoho API
   */
  private async post<T>(endpoint: string, data?: unknown, params?: Record<string, unknown>): Promise<ZohoApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params: {
        organization_id: this.zoho.organizationId,
        ...params,
      },
    };

    const response: AxiosResponse<ZohoApiResponse<T>> = await this.axiosInstance.post(endpoint, data, requestConfig);
    return response.data;
  }

  /**
   * Make a PUT request to the Zoho API
   */
  private async put<T>(endpoint: string, data?: unknown, params?: Record<string, unknown>): Promise<ZohoApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params: {
        organization_id: this.zoho.organizationId,
        ...params,
      },
    };

    const response: AxiosResponse<ZohoApiResponse<T>> = await this.axiosInstance.put(endpoint, data, requestConfig);
    return response.data;
  }

  /**
   * Make a DELETE request to the Zoho API
   */
  private async _delete<T>(endpoint: string, params?: Record<string, unknown>): Promise<ZohoApiResponse<T>> {
    const requestConfig: AxiosRequestConfig = {
      params: {
        organization_id: this.zoho.organizationId,
        ...params,
      },
    };

    const response: AxiosResponse<ZohoApiResponse<T>> = await this.axiosInstance.delete(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Get Zoho configuration
   */
  private get zoho() {
    return config.zoho;
  }

  /**
   * Convert sort order from user-friendly format to API format
   */
  private normalizeSortOrder(sortOrder?: SortOrder): 'A' | 'D' {
    if (!sortOrder) return 'A';
    
    switch (sortOrder.toLowerCase()) {
      case 'a':
      case 'ascending':
        return 'A';
      case 'd':
      case 'descending':
        return 'D';
      default:
        return 'A';
    }
  }

  // ===== Invoice Methods =====

  /**
   * List invoices
   */
  async listInvoices(params: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
    search_text?: string;
    sort_column?: string;
    sort_order?: SortOrder;
  } = {}) {
    const apiParams = {
      page: params.page || 1,
      per_page: params.per_page || 25,
      ...(params.customer_id && { customer_id: params.customer_id }),
      ...(params.status && { status: params.status }),
      ...(params.date_start && { date_start: params.date_start }),
      ...(params.date_end && { date_end: params.date_end }),
      ...(params.search_text && { search_text: params.search_text }),
      ...(params.sort_column && { sort_column: params.sort_column }),
      sort_order: this.normalizeSortOrder(params.sort_order),
    };

    return this.get('/invoices', apiParams);
  }

  /**
   * Get a specific invoice
   */
  async getInvoice(invoiceId: string) {
    return this.get(`/invoices/${invoiceId}`);
  }

  /**
   * Create a new invoice
   */
  async createInvoice(invoiceData: unknown) {
    return this.post('/invoices', invoiceData);
  }

  // ===== Contact Methods =====

  /**
   * List contacts
   */
  async listContacts(params: {
    page?: number;
    per_page?: number;
    contact_type?: string;
    status?: string;
    search_text?: string;
    sort_column?: string;
    sort_order?: SortOrder;
  } = {}) {
    const apiParams = {
      page: params.page || 1,
      per_page: params.per_page || 25,
      ...(params.contact_type && params.contact_type !== 'all' && { contact_type: params.contact_type }),
      ...(params.status && params.status !== 'all' && { status: params.status }),
      ...(params.search_text && { search_text: params.search_text }),
      ...(params.sort_column && { sort_column: params.sort_column }),
      sort_order: this.normalizeSortOrder(params.sort_order),
    };

    return this.get('/contacts', apiParams);
  }

  /**
   * Get a specific contact
   */
  async getContact(contactId: string) {
    return this.get(`/contacts/${contactId}`);
  }

  /**
   * Create a new contact
   */
  async createContact(contactData: unknown) {
    return this.post('/contacts', contactData);
  }

  // ===== Item Methods =====

  /**
   * List items
   */
  async listItems(params: {
    page?: number;
    per_page?: number;
    search_text?: string;
    status?: string;
    item_type?: string;
    sort_column?: string;
    sort_order?: SortOrder;
  } = {}) {
    const apiParams = {
      page: params.page || 1,
      per_page: params.per_page || 25,
      ...(params.search_text && { search_text: params.search_text }),
      ...(params.status && params.status !== 'all' && { status: params.status }),
      ...(params.item_type && params.item_type !== 'all' && { item_type: params.item_type }),
      ...(params.sort_column && { sort_column: params.sort_column }),
      sort_order: this.normalizeSortOrder(params.sort_order),
    };

    return this.get('/items', apiParams);
  }

  /**
   * Get a specific item
   */
  async getItem(itemId: string) {
    return this.get(`/items/${itemId}`);
  }

  /**
   * Create a new item
   */
  async createItem(itemData: unknown) {
    return this.post('/items', itemData);
  }

  /**
   * Update an existing item
   */
  async updateItem(itemId: string, itemData: unknown) {
    return this.put(`/items/${itemId}`, itemData);
  }

  // ===== Sales Order Methods =====

  /**
   * List sales orders
   */
  async listSalesOrders(params: {
    page?: number;
    per_page?: number;
    customer_id?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
    search_text?: string;
    sort_column?: string;
    sort_order?: SortOrder;
  } = {}) {
    const apiParams = {
      page: params.page || 1,
      per_page: params.per_page || 25,
      ...(params.customer_id && { customer_id: params.customer_id }),
      ...(params.status && { status: params.status }),
      ...(params.date_start && { date_start: params.date_start }),
      ...(params.date_end && { date_end: params.date_end }),
      ...(params.search_text && { search_text: params.search_text }),
      ...(params.sort_column && { sort_column: params.sort_column }),
      sort_order: this.normalizeSortOrder(params.sort_order),
    };

    return this.get('/salesorders', apiParams);
  }

  /**
   * Get a specific sales order
   */
  async getSalesOrder(salesOrderId: string) {
    return this.get(`/salesorders/${salesOrderId}`);
  }

  // ===== Expense Methods =====

  /**
   * List expenses
   */
  async listExpenses(params: {
    page?: number;
    per_page?: number;
    vendor_id?: string;
    customer_id?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
    search_text?: string;
    sort_column?: string;
    sort_order?: SortOrder;
  } = {}) {
    const apiParams = {
      page: params.page || 1,
      per_page: params.per_page || 25,
      ...(params.vendor_id && { vendor_id: params.vendor_id }),
      ...(params.customer_id && { customer_id: params.customer_id }),
      ...(params.status && { status: params.status }),
      ...(params.date_start && { date_start: params.date_start }),
      ...(params.date_end && { date_end: params.date_end }),
      ...(params.search_text && { search_text: params.search_text }),
      ...(params.sort_column && { sort_column: params.sort_column }),
      sort_order: this.normalizeSortOrder(params.sort_order),
    };

    return this.get('/expenses', apiParams);
  }

  /**
   * Get a specific expense
   */
  async getExpense(expenseId: string) {
    return this.get(`/expenses/${expenseId}`);
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData: unknown) {
    return this.post('/expenses', expenseData);
  }

  // ===== Health Check Method =====

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await this.get('/organizations/me');
      return {
        success: true,
        organization: response.data,
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
export const zohoBooksClient = new ZohoBooksClient(); 