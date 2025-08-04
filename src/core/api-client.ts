import { WidgetConfig, TicketData, TicketResponse, ApiResponse, UploadResponse, AnalyticsEvent } from './types';
import { StorageManager } from '../utils/storage-manager';

export class ApiClient {
  private config: WidgetConfig;
  private baseUrl: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || 'https://your-api-domain.com/api';
  }

  async createTicket(data: TicketData): Promise<ApiResponse<TicketResponse>> {
    const url = `${this.baseUrl}/widget/tickets`;
    
    const payload = {
      ...data,
      project_id: this.config.projectId
    };

    return this.requestWithAuth('POST', url, payload);
  }

  async uploadFile(file: File, ticketId?: string): Promise<ApiResponse<UploadResponse>> {
    const url = `${this.baseUrl}/widget/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', this.config.projectId);
    
    if (ticketId) {
      formData.append('ticket_id', ticketId);
    }

    return this.requestWithAuth('POST', url, formData, {
      headers: {
        'X-Widget-API-Key': this.config.apiKey
      }
    });
  }

  async getTicketStatus(ticketId: string): Promise<ApiResponse<TicketResponse>> {
    const url = `${this.baseUrl}/widget/tickets/${ticketId}`;
    return this.requestWithAuth('GET', url);
  }

  async trackEvent(event: AnalyticsEvent): Promise<ApiResponse<void>> {
    const url = `${this.baseUrl}/widget/analytics`;
    return this.requestWithAuth('POST', url, event);
  }

  // API key validation removed - using user authentication instead

  private async request(
    method: string,
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<any>> {
    const isFormData = data instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
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

    const config: RequestInit = {
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

  private async requestWithRetry(
    url: string,
    config: RequestInit,
    attempt: number = 1
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status >= 500 && attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
          return this.requestWithRetry(url, config, attempt + 1);
        }
        
        return this.handleErrorResponse(response);
      }

      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, config, attempt + 1);
      }
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network request failed',
          details: error
        }
      };
    }
  }

  private async handleErrorResponse(response: Response): Promise<ApiResponse<any>> {
    let errorData;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error occurred' };
    }

    const errorCode = this.getErrorCode(response.status);
    
    return {
      success: false,
      error: {
        code: errorCode,
        message: errorData.message || errorData.error || 'Request failed',
        details: errorData
      }
    };
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 500: return 'SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // setApiKey removed - using user authentication instead

  public setProjectId(projectId: string): void {
    this.config.projectId = projectId;
  }

  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return StorageManager.isAuthenticated();
  }

  /**
   * Get current user info
   */
  public getCurrentUser(): any {
    return StorageManager.getCurrentUser();
  }

  /**
   * Handle 401 Unauthorized responses by attempting token refresh
   */
  private async handleUnauthorized(): Promise<boolean> {
    const refreshToken = StorageManager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      // Attempt to refresh the token
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const authData = await response.json();
        const session = {
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          expires_at: authData.expires_at,
          user: authData.user
        };

        StorageManager.storeSession(session);
        return true;
      }
    } catch (error) {
      console.error('[ApiClient] Token refresh failed:', error);
    }

    // Refresh failed, clear session
    StorageManager.clearSession();
    return false;
  }

  /**
   * Enhanced request with automatic token refresh on 401
   */
  private async requestWithAuth(
    method: string,
    url: string,
    data?: any,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<any>> {
    const response = await this.request(method, url, data, options);
    
    // If request failed with 401 and we haven't retried yet, try to refresh token
    if (!response.success && 
        response.error?.code === 'UNAUTHORIZED' && 
        retryCount === 0 && 
        StorageManager.getRefreshToken()) {
      
      const refreshed = await this.handleUnauthorized();
      if (refreshed) {
        // Retry the original request with new token
        return this.requestWithAuth(method, url, data, options, retryCount + 1);
      }
    }

    return response;
  }
} 