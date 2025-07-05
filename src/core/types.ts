export interface WidgetConfig {
  // Required configuration
  apiKey: string;
  orgId: string;

  // Optional configuration
  apiUrl?: string;
  theme?: ThemeType;
  position?: PositionType;
  buttonText?: string;
  language?: LanguageType;
  allowedDomains?: string[];
  showBranding?: boolean;
  customStyles?: string;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  
  // Advanced options
  autoOpen?: boolean;
  enableAnalytics?: boolean;
  customFields?: CustomField[];
  categories?: string[];
  priorities?: string[];
  
  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onSubmit?: (data: TicketData) => void;
  onSuccess?: (ticket: TicketResponse) => void;
  onError?: (error: WidgetError) => void;
}

export type ThemeType = 'default' | 'modern' | 'minimal' | 'dark' | 'custom';
export type PositionType = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type LanguageType = 'en' | 'nl' | 'de' | 'fr' | 'es';

export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  validation?: RegExp;
}

export interface TicketData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
  customFields?: Record<string, any>;
  attachments?: File[];
}

export interface TicketResponse {
  id: string;
  ticket_number: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WidgetError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: WidgetError;
}

export interface UploadResponse {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface I18nMessages {
  [key: string]: string | I18nMessages;
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    textLight: string;
    border: string;
    success: string;
    error: string;
    warning: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
}

export interface WidgetState {
  isOpen: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  hasError: boolean;
  errorMessage?: string;
  currentStep: number;
  formData: Partial<TicketData>;
  uploadedFiles: File[];
}

export interface EventPayload {
  type: string;
  data?: any;
  timestamp: number;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
} 