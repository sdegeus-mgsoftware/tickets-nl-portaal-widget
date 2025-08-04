import { WidgetConfig, WidgetState, TicketData, TicketResponse, WidgetError, ThemeType, LanguageType } from './types';
import { ApiClient } from './api-client';
import { EventEmitter } from './event-emitter';
import { I18nManager } from '@/i18n/i18n-manager';
import { ThemeManager } from '@/styles/theme-manager';
import { VisualFeedbackModal, FeedbackData } from '@/components/visual-feedback-modal';
import { WidgetButton } from '@/components/button';
import { validateEmail, validateRequired, sanitizeInput } from '@/utils/validation';
import { generateSessionId } from '@/utils/helpers';

export class TicketWidget extends EventEmitter {
  private config: WidgetConfig;
  private state: WidgetState;
  private apiClient: ApiClient;
  private i18n: I18nManager;
  private themeManager: ThemeManager;
  private modal: VisualFeedbackModal | null = null;
  private button: WidgetButton | null = null;
  private sessionId: string;

  constructor(config: WidgetConfig) {
    super();
    
    this.config = this.validateAndNormalizeConfig(config);
    this.sessionId = generateSessionId();
    
    this.state = {
      isOpen: false,
      isLoading: false,
      isSubmitting: false,
      hasError: false,
      currentStep: 0,
      formData: {},
      uploadedFiles: []
    };

    this.apiClient = new ApiClient(this.config);
    this.i18n = new I18nManager(this.config.language || 'en');
    this.themeManager = new ThemeManager(this.config.theme || 'default');

    this.initialize();
  }

  private validateAndNormalizeConfig(config: WidgetConfig): WidgetConfig {
    if (!config.apiKey) {
      throw new Error('TicketWidget: apiKey is required');
    }
    
    if (!config.orgId) {
      throw new Error('TicketWidget: orgId is required');
    }

    return {
      apiUrl: 'https://your-api-domain.com/api',
      theme: 'default',
      position: 'bottom-right',
      buttonText: undefined, // Will be set by i18n
      language: 'en',
      allowedDomains: [],
      showBranding: true,
      maxFileSize: 10485760, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      autoOpen: false,
      enableAnalytics: true,
      customFields: [],
      categories: [],
      priorities: [],
      ...config
    };
  }

  private async initialize(): Promise<void> {
    try {
      // Load theme
      await this.themeManager.loadTheme(this.config.theme!);
      
      // Load translations
      await this.i18n.loadLanguage(this.config.language!);
      
      // Set default button text if not provided
      if (!this.config.buttonText) {
        this.config.buttonText = this.i18n.t('button.help');
      }

      // Create UI components
      this.createButton();
      this.createModal();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Auto-open if configured
      if (this.config.autoOpen) {
        this.open();
      }
      
      // Track initialization
      this.trackEvent('widget_initialized');
      
    } catch (error) {
      console.error('TicketWidget: Failed to initialize', error);
      this.handleError({
        code: 'INIT_ERROR',
        message: 'Failed to initialize widget',
        details: error
      });
    }
  }

  private createButton(): void {
    this.button = new WidgetButton({
      text: this.config.buttonText!,
      position: this.config.position!,
      theme: this.config.theme!,
      onClick: () => this.open()
    });
  }

  private createModal(): void {
    this.modal = new VisualFeedbackModal({
      config: this.config,
      i18n: this.i18n,
      themeManager: this.themeManager,
      onClose: () => this.close(),
      onSubmit: (data: FeedbackData) => this.submitFeedback(data)
    });
  }

  private setupEventListeners(): void {
    // Listen for escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.close();
      }
    });

    // Listen for configuration changes
    this.on('config:change', (newConfig: Partial<WidgetConfig>) => {
      this.updateConfig(newConfig);
    });

    // Listen for theme changes
    this.on('theme:change', (theme: string) => {
      this.themeManager.setTheme(theme as ThemeType);
    });

    // Listen for language changes
    this.on('language:change', (language: string) => {
      this.i18n.setLanguage(language as LanguageType);
    });
  }

  public open(): void {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.modal?.show();
    this.button?.hide();
    
    this.trackEvent('widget_opened');
    this.emit('open');
    
    if (this.config.onOpen) {
      this.config.onOpen();
    }
  }

  public close(): void {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.modal?.hide();
    this.button?.show();
    
    this.trackEvent('widget_closed');
    this.emit('close');
    
    if (this.config.onClose) {
      this.config.onClose();
    }
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private async submitFeedback(data: FeedbackData): Promise<void> {
    if (this.state.isSubmitting) return;

    try {
      this.state.isSubmitting = true;
      this.state.hasError = false;

      // For now, just log the feedback data and show success (debug mode only)
      // Later we'll integrate with proper API
      if (this.config.debugMode) {
        console.log('Visual Feedback submitted:', data);
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success and auto-close
      this.trackEvent('visual_feedback_submitted', { 
        description_length: data.description.length,
        has_screenshot: !!data.screenshot,
        annotations_count: data.annotations.length
      });
      
      // Auto-close after brief delay
      setTimeout(() => {
        this.close();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      this.state.isSubmitting = false;
    }
  }

  /* 
  // Commented out unused methods to fix build
  private validateTicketData(data: TicketData): { isValid: boolean; error?: string } {
    // ... validation logic
    return { isValid: true };
  }

  private sanitizeTicketData(data: TicketData): TicketData {
    // ... sanitization logic
    return data;
  }

  private handleSubmissionSuccess(ticket: TicketResponse): void {
    // ... success handling
  }

  private handleSubmissionError(error: any): void {
    // ... error handling
  }

  private async handleFileUpload(files: File[]): Promise<void> {
    // ... file upload logic
  }
*/

  private handleError(error: WidgetError): void {
    console.error('TicketWidget Error:', error);
    this.state.hasError = true;
    this.state.errorMessage = error.message;
    this.emit('error', error);
    
    if (this.config.onError) {
      this.config.onError(error);
    }
  }

  private trackEvent(event: string, properties?: Record<string, any>): void {
    if (!this.config.enableAnalytics) return;

    const eventData = {
      event,
      properties,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };

    this.emit('analytics:event', eventData);
    
    // Send to analytics service if configured
    if (this.config.apiUrl) {
      this.apiClient.trackEvent(eventData).catch(console.error);
    }
  }

  public updateConfig(newConfig: Partial<WidgetConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Re-initialize components if needed
    if (newConfig.theme) {
      this.themeManager.setTheme(newConfig.theme);
    }
    
    if (newConfig.language) {
      this.i18n.setLanguage(newConfig.language);
    }
    
    if (newConfig.buttonText) {
      this.button?.setText(newConfig.buttonText);
    }
    
    this.emit('config:updated', this.config);
  }

  public getState(): WidgetState {
    return { ...this.state };
  }

  public getConfig(): WidgetConfig {
    return { ...this.config };
  }

  public destroy(): void {
    this.close();
    this.modal?.destroy();
    this.button?.destroy();
    this.removeAllListeners();
    this.trackEvent('widget_destroyed');
  }
} 