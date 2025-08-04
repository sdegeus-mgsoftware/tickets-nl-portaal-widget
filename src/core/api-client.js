import { StorageManager } from '../utils/storage-manager.js';

export class ApiClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://your-api-domain.com/api';
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  async createTicket(data) {
    const url = `${this.baseUrl}/widget/tickets`;
    
    const payload = {
      ...data,
      project_id: this.config.projectId
    };

    return this.requestWithAuth('POST', url, payload);
  }

  async uploadFile(file, ticketId) {
    const url = `${this.baseUrl}/widget/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', this.config.projectId);
    
    if (ticketId) {
      formData.append('ticket_id', ticketId);
    }

    return this.requestWithAuth('POST', url, formData);
  }

  async sendAnalytics(event) {
    const url = `${this.baseUrl}/widget/analytics`;
    return this.requestWithAuth('POST', url, event);
  }

  // API key validation removed - using user authentication instead

  async request(method, url, data, options = {}) {
    const isFormData = data instanceof FormData;
    
    const defaultHeaders = {
      'X-Project-ID': this.config.projectId
    };

    // Add authentication header if user is logged in
    const accessToken = StorageManager.getAccessToken();
    if (accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
    }

    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    return this.requestWithRetry(url, config);
  }

  async requestWithRetry(url, config, attempt = 1) {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status >= 500 && attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.requestWithRetry(url, config, attempt + 1);
        }

        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            details: errorData
          }
        };
      }

      const responseData = await response.json();
      
      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      if (attempt < this.retryAttempts && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, config, attempt + 1);
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          details: error
        }
      };
    }
  }

  async requestWithAuth(method, url, data, options = {}) {
    // Use the existing request method which already handles auth
    return this.request(method, url, data, options);
  }

  isRetryableError(error) {
    // Retry on network errors but not on authentication or client errors
    return error.name === 'TypeError' || // Network errors
           error.name === 'NetworkError' ||
           error.code === 'NETWORK_ERROR';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setProjectId(projectId) {
    this.config.projectId = projectId;
  }

  getProjectId() {
    return this.config.projectId;
  }

  setBaseUrl(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // Health check endpoint
  async healthCheck() {
    const url = `${this.baseUrl}/health`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get API configuration
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      projectId: this.config.projectId,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay
    };
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.apiUrl) {
      this.baseUrl = newConfig.apiUrl;
    }
  }
}