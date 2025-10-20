/**
 * OAuth Handler for Zoho CRM
 * Handles OAuth 2.0 authorization flow and token management
 */

import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from './logger.js';
import { ZohoApiClientError, type ZohoAuthTokens } from '../types/index.js';
import fs from 'fs/promises';
import path from 'path';

export class OAuthHandler {
  private clientId: string;
  private clientSecret: string;
  private region: string;
  private redirectUri: string;

  constructor() {
    this.clientId = config.zoho.clientId;
    this.clientSecret = config.zoho.clientSecret;
    this.region = config.zoho.region;
    this.redirectUri = `http://localhost:${config.server.port + 1}/oauth/callback`;
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  async getAuthorizationUrl(): Promise<string> {
    const baseUrl = `https://accounts.zoho.${this.region}/oauth/v2/auth`;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: 'ZohoCRM.modules.ALL,ZohoCRM.users.ALL,ZohoCRM.settings.ALL',
      access_type: 'offline',
      prompt: 'consent'
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    logger.info('Generated OAuth authorization URL with scopes', { 
      authUrl,
      scopes: 'ZohoCRM.modules.ALL,ZohoCRM.users.ALL,ZohoCRM.settings.ALL'
    });
    
    return authUrl;
  }

  /**
   * Exchange authorization code for tokens (gets refresh token)
   */
  async exchangeCodeForTokens(code: string): Promise<ZohoAuthTokens> {
    try {
      const tokenUrl = `https://accounts.zoho.${this.region}/oauth/v2/token`;
      
      const response = await axios.post(tokenUrl, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: code,
          grant_type: 'authorization_code'
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokens: ZohoAuthTokens = response.data;
      logger.info('Successfully exchanged code for tokens', {
        hasRefreshToken: !!tokens.refresh_token,
        hasAccessToken: !!tokens.access_token,
        expiresIn: tokens.expires_in
      });
      
      return tokens;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ZohoApiClientError(
        `Failed to exchange code for tokens: ${errorMessage}`,
        400,
        { originalError: error }
      );
    }
  }

  /**
   * Save tokens to tokens.json file
   */
  async saveTokensToEnv(tokens: ZohoAuthTokens): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      
      // Create tokens object with expiration
      const tokenData = {
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        created_at: new Date().toISOString(),
        token_type: tokens.token_type || 'Bearer'
      };

      // Write tokens to JSON file
      await fs.writeFile(tokensPath, JSON.stringify(tokenData, null, 2), 'utf-8');
      
      logger.info('Tokens saved to tokens.json file successfully');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ZohoApiClientError(
        `Failed to save tokens to tokens.json file: ${errorMessage}`,
        500,
        { originalError: error }
      );
    }
  }

  /**
   * Get stored tokens from .env file
   */
  async getStoredTokens(): Promise<{ access_token?: string; refresh_token?: string; expires_at?: string } | null> {
    try {
      const envPath = path.join(process.cwd(), '.env');
      const envContent = await fs.readFile(envPath, 'utf-8');
      
      const tokens: { access_token?: string; refresh_token?: string; expires_at?: string } = {};
      
      // Parse .env file
      const lines = envContent.split('\n');
      for (const line of lines) {
        const [key, value] = line.split('=');
        if (key && value) {
          switch (key.trim()) {
            case 'ZOHO_ACCESS_TOKEN':
              tokens.access_token = value.trim();
              break;
            case 'ZOHO_REFRESH_TOKEN':
              tokens.refresh_token = value.trim();
              break;
            case 'ZOHO_TOKEN_EXPIRES_AT':
              tokens.expires_at = value.trim();
              break;
          }
        }
      }

      return Object.keys(tokens).length > 0 ? tokens : null;
    } catch (error) {
      logger.warn('Could not read stored tokens from .env file');
      return null;
    }
  }

  /**
   * Check if tokens are valid and not expired
   */
  isTokenValid(tokens: { access_token?: string; refresh_token?: string; expires_at?: string }): boolean {
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expires_at) {
      return false;
    }

    try {
      const expiresAt = new Date(tokens.expires_at);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      return expiresAt.getTime() > (now.getTime() + bufferTime);
    } catch (error) {
      logger.warn('Invalid token expiration date');
      return false;
    }
  }

  /**
   * Get OAuth status and instructions
   */
  async getOAuthStatus(): Promise<{ isConfigured: boolean; hasTokens: boolean; instructions: string; redirectUri: string }> {
    const isConfigured = !!(this.clientId && this.clientSecret);
    
    // Check for tokens in tokens.json file
    let hasTokens = false;
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      await fs.access(tokensPath);
      hasTokens = true;
    } catch (error) {
      hasTokens = false;
    }
    
    let instructions = '';
    
    if (!isConfigured) {
      instructions = `
OAuth is not configured. Please:
1. Set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in your .env file
2. Restart the server
3. Visit http://localhost:${config.server.port + 1}/oauth/authorize to complete OAuth flow

Required Zoho OAuth Setup:
- Redirect URI: http://localhost:${config.server.port + 1}/oauth/callback
- Scopes: ZohoCRM.modules.ALL, ZohoCRM.users.ALL, ZohoCRM.settings.ALL
- OAuth Flow: Server-based (not self-client)
      `.trim();
    } else if (!hasTokens) {
      instructions = `
OAuth is configured but no tokens found. Please:
1. Visit http://localhost:${config.server.port + 1}/oauth/authorize to complete OAuth flow
2. After authorization, refresh token will be saved automatically
3. Server will use refresh token to get access tokens for API calls

OAuth Flow:
1. Authorization URL includes required scopes
2. User authorizes and gets redirected back
3. Server exchanges code for refresh token
4. Server uses refresh token to get access tokens
      `.trim();
    } else {
      instructions = 'OAuth is configured and tokens are available. Server will use refresh token to get access tokens for API calls.';
    }

    return { 
      isConfigured, 
      hasTokens, 
      instructions,
      redirectUri: `http://localhost:${config.server.port + 1}/oauth/callback`
    };
  }
}
