import { WidgetConfig, TicketData, TicketResponse, ApiResponse, UploadResponse, AnalyticsEvent } from './types';

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
      organization_id: this.config.orgId
    };

    return this.request('POST', url, payload);
  }

  async uploadFile(file: File, ticketId?: string): Promise<ApiResponse<UploadResponse>> {
    const url = `${this.baseUrl}/widget/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('organization_id', this.config.orgId);
    
    if (ticketId) {
      formData.append('ticket_id', ticketId);
    }

    return this.request('POST', url, formData, {
      headers: {
        'X-Widget-API-Key': this.config.apiKey
      }
    });
  }

  async getTicketStatus(ticketId: string): Promise<ApiResponse<TicketResponse>> {
    const url = `${this.baseUrl}/widget/tickets/${ticketId}`;
    return this.request('GET', url);
  }

  async trackEvent(event: AnalyticsEvent): Promise<ApiResponse<void>> {
    const url = `${this.baseUrl}/widget/analytics`;
    return this.request('POST', url, event);
  }

  async validateApiKey(): Promise<ApiResponse<{ valid: boolean; organization: string }>> {
    const url = `${this.baseUrl}/widget/validate`;
    return this.request('POST', url, { 
      api_key: this.config.apiKey,
      organization_id: this.config.orgId 
    });
  }

  private async request(
    method: string,
    url: string,
    data?: any,
    options: RequestInit = {}
  ): Promise<ApiResponse<any>> {
    const isFormData = data instanceof FormData;
    
    const defaultHeaders: Record<string, string> = {
      'X-Widget-API-Key': this.config.apiKey,
      'X-Organization-ID': this.config.orgId
    };

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

  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  public setOrganizationId(orgId: string): void {
    this.config.orgId = orgId;
  }

  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
} 