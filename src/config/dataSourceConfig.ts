/**
 * Data Source Configuration
 * Configure whether to load FHIR bundles from local files or API
 */

export type DataSourceType = 'local' | 'api';

export interface DataSourceConfig {
  type: DataSourceType;
  apiBaseUrl?: string;
  apiTimeout?: number;
  localResourcePath?: string;
}

// Default configuration - can be overridden via environment variables
const DEFAULT_CONFIG: DataSourceConfig = {
  type: (import.meta.env.VITE_DATA_SOURCE_TYPE as DataSourceType) || 'local',
  apiBaseUrl: import.meta.env.VITE_DATA_SOURCE_API_URL || '',
  apiTimeout: parseInt(import.meta.env.VITE_DATA_SOURCE_API_TIMEOUT || '30000'),
  localResourcePath: import.meta.env.VITE_LOCAL_RESOURCE_PATH || '/resources'
};

class DataSourceConfigManager {
  private config: DataSourceConfig = DEFAULT_CONFIG;

  /**
   * Get current data source configuration
   */
  getConfig(): DataSourceConfig {
    return { ...this.config };
  }

  /**
   * Get current data source type
   */
  getType(): DataSourceType {
    return this.config.type;
  }

  /**
   * Check if using local file source
   */
  isLocal(): boolean {
    return this.config.type === 'local';
  }

  /**
   * Check if using API source
   */
  isApi(): boolean {
    return this.config.type === 'api';
  }

  /**
   * Switch to local file source
   */
  useLocal(resourcePath?: string): void {
    this.config.type = 'local';
    if (resourcePath) {
      this.config.localResourcePath = resourcePath;
    }
    console.log('✅ Data source switched to LOCAL files:', this.config.localResourcePath);
  }

  /**
   * Switch to API source
   */
  useApi(baseUrl?: string, timeout?: number): void {
    this.config.type = 'api';
    if (baseUrl) {
      this.config.apiBaseUrl = baseUrl;
    }
    if (timeout) {
      this.config.apiTimeout = timeout;
    }

    if (!this.config.apiBaseUrl) {
      console.warn('⚠️  API base URL not configured. Please set apiBaseUrl.');
    } else {
      console.log('✅ Data source switched to API:', this.config.apiBaseUrl);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DataSourceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('✅ Data source configuration updated:', this.config);
  }

  /**
   * Get API base URL (if configured)
   */
  getApiBaseUrl(): string {
    return this.config.apiBaseUrl || '';
  }

  /**
   * Get local resource path
   */
  getLocalResourcePath(): string {
    return this.config.localResourcePath || '/resources';
  }

  /**
   * Get API timeout
   */
  getApiTimeout(): number {
    return this.config.apiTimeout || 30000;
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.type === 'api' && !this.config.apiBaseUrl) {
      errors.push('API base URL is required when using API data source');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
export const dataSourceConfig = new DataSourceConfigManager();

// Convenience functions
export const useLocalDataSource = (resourcePath?: string) => dataSourceConfig.useLocal(resourcePath);
export const useApiDataSource = (baseUrl?: string, timeout?: number) => dataSourceConfig.useApi(baseUrl, timeout);
export const getDataSourceType = () => dataSourceConfig.getType();
export const isLocalDataSource = () => dataSourceConfig.isLocal();
export const isApiDataSource = () => dataSourceConfig.isApi();

export default dataSourceConfig;

