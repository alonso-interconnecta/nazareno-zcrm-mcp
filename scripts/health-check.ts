#!/usr/bin/env tsx
/**
 * Health Check Script for Zoho CRM MCP Server
 */

import axios from 'axios';
import { config } from '../src/config/index.js';

const HEALTH_CHECK_URL = `http://localhost:${config.server.port}/health`;

async function healthCheck(): Promise<void> {
  try {
    console.log(`Checking health at ${HEALTH_CHECK_URL}...`);
    
    const response = await axios.get(HEALTH_CHECK_URL, {
      timeout: 5000,
    });
    
    if (response.status === 200) {
      console.log('✅ Health check passed');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      process.exit(0);
    } else {
      console.log('❌ Health check failed');
      console.log('Status:', response.status);
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run health check
healthCheck();
