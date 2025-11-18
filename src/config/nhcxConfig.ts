/**
 * NHCX API Configuration and Initialization
 */

import { initializeNHCXAPI } from '../services/nhcxApiService';

// Get configuration from environment variables
const NHCX_API_BASE_URL = import.meta.env.VITE_NHCX_API_BASE_URL || '';
const NHCX_POLLING_INTERVAL = parseInt(import.meta.env.VITE_NHCX_POLLING_INTERVAL || '30000');
const NHCX_MAX_POLLING_ATTEMPTS = parseInt(import.meta.env.VITE_NHCX_MAX_POLLING_ATTEMPTS || '120');

export const nhcxConfig = {
  baseUrl: NHCX_API_BASE_URL,
  pollingInterval: NHCX_POLLING_INTERVAL,
  maxPollingAttempts: NHCX_MAX_POLLING_ATTEMPTS
};

/**
 * Initialize NHCX API service
 * Call this once at app startup
 */
export const initNHCXService = () => {
  if (!NHCX_API_BASE_URL) {
    console.warn('VITE_NHCX_API_BASE_URL not configured. NHCX API features will not work.');
    return null;
  }

  try {
    const api = initializeNHCXAPI({
      baseUrl: NHCX_API_BASE_URL,
      timeout: 30000
    });

    console.log('✅ NHCX API Service initialized successfully');
    console.log(`Base URL: ${NHCX_API_BASE_URL}`);

    return api;
  } catch (error) {
    console.error('❌ Failed to initialize NHCX API Service:', error);
    return null;
  }
};

export default {
  config: nhcxConfig,
  init: initNHCXService
};
