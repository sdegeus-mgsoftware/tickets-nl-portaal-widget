import { WidgetConfig, TicketData, TicketResponse } from '@/core/types';
import { I18nManager } from '@/i18n/i18n-manager';
import { ThemeManager } from '@/styles/theme-manager';
import { createElement } from '@/utils/helpers';
import { validateEmail, validateRequired } from '@/utils/validation';

export interface WidgetModalConfig {
  config: WidgetConfig;
  i18n: I18nManager;
  themeManager: ThemeManager;
  onClose: () => void;
  onSubmit: (data: TicketData) => void;
  onUpload: (files: File[]) => void;
}

export class WidgetModal {
  private element: HTMLElement;
  private config: WidgetModalConfig;
  private isLoading = false;

  constructor(config: WidgetModalConfig) {
    this.config = config;
    this.element = this.createElement();
    this.attachEventListeners();
    this.render();
  }

  private createElement(): HTMLElement {
    const modal = createElement('div', {
      class: 'ticket-widget-modal',
      id: 'ticket-widget-modal'
    });

    modal.innerHTML = `
      <div class="ticket-widget-overlay"></div>
      <div class="ticket-widget-content">
        <div class="ticket-widget-header">
          <h3>${this.config.i18n.t('form.contact_support') || 'Contact Support'}</h3>
          <button class="ticket-widget-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="ticket-widget-body">
          <form class="ticket-widget-form" id="ticket-widget-form">
            <div class="ticket-widget-field">
              <label for="tw-name">${this.config.i18n.t('form.name')} *</label>
              <input 
                type="text" 
                id="tw-name" 
                name="name" 
                required 
                placeholder="${this.config.i18n.t('placeholder.name')}"
              >
              <span class="ticket-widget-error" id="error-name"></span>
            </div>
            
            <div class="ticket-widget-field">
              <label for="tw-email">${this.config.i18n.t('form.email')} *</label>
              <input 
                type="email" 
                id="tw-email" 
                name="email" 
                required 
                placeholder="${this.config.i18n.t('placeholder.email')}"
              >
              <span class="ticket-widget-error" id="error-email"></span>
            </div>
            
            <div class="ticket-widget-field">
              <label for="tw-subject">${this.config.i18n.t('form.subject')} *</label>
              <input 
                type="text" 
                id="tw-subject" 
                name="subject" 
                required 
                placeholder="${this.config.i18n.t('placeholder.subject')}"
              >
              <span class="ticket-widget-error" id="error-subject"></span>
            </div>
            
            <div class="ticket-widget-field">
              <label for="tw-message">${this.config.i18n.t('form.message')} *</label>
              <textarea 
                id="tw-message" 
                name="message" 
                rows="4" 
                required 
                placeholder="${this.config.i18n.t('placeholder.message')}"
              ></textarea>
              <span class="ticket-widget-error" id="error-message"></span>
            </div>
            
            ${this.config.config.categories && this.config.config.categories.length > 0 ? `
              <div class="ticket-widget-field">
                <label for="tw-category">${this.config.i18n.t('form.category')}</label>
                <select id="tw-category" name="category">
                  <option value="">Select category...</option>
                  ${this.config.config.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
              </div>
            ` : ''}
            
            <div class="ticket-widget-actions">
              <button type="submit" class="ticket-widget-submit" id="submit-btn">
                <span class="submit-text">${this.config.i18n.t('button.send')}</span>
                <span class="submit-loader" style="display: none;">⟳</span>
              </button>
              <button type="button" class="ticket-widget-cancel">${this.config.i18n.t('button.cancel')}</button>
            </div>
          </form>
          
          <div class="ticket-widget-success" id="success-message" style="display: none;">
            <div class="success-icon">✓</div>
            <h4>${this.config.i18n.t('success.ticket_created')}</h4>
            <p id="ticket-info"></p>
            <p>${this.config.i18n.t('success.will_contact')}</p>
          </div>
          
          <div class="ticket-widget-error-message" id="error-message" style="display: none;">
            <div class="error-icon">⚠</div>
            <p id="error-text"></p>
          </div>
        </div>
        
        ${this.config.config.showBranding ? `
          <div class="ticket-widget-branding">
            <small>Powered by TicketWidget</small>
          </div>
        ` : ''}
      </div>
    `;

    return modal;
  }

  private attachEventListeners(): void {
    // Close button
    const closeBtn = this.element.querySelector('.ticket-widget-close');
    closeBtn?.addEventListener('click', this.config.onClose);

    // Cancel button
    const cancelBtn = this.element.querySelector('.ticket-widget-cancel');
    cancelBtn?.addEventListener('click', this.config.onClose);

    // Overlay click
    const overlay = this.element.querySelector('.ticket-widget-overlay');
    overlay?.addEventListener('click', this.config.onClose);

    // Form submission
    const form = this.element.querySelector('#ticket-widget-form') as HTMLFormElement;
    form?.addEventListener('submit', this.handleSubmit.bind(this));

    // Real-time validation
    const inputs = this.element.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', this.validateField.bind(this));
      input.addEventListener('input', this.clearFieldError.bind(this));
    });
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    
    if (this.isLoading) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Validate all fields
    if (!this.validateForm(formData)) {
      return;
    }

    // Prepare ticket data
    const ticketData: TicketData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
      category: formData.get('category') as string || undefined,
      attachments: []
    };

    this.config.onSubmit(ticketData);
  }

  private validateForm(formData: FormData): boolean {
    let isValid = true;
    
    // Clear previous errors
    this.clearAllErrors();

    // Validate name
    const name = formData.get('name') as string;
    if (!validateRequired(name)) {
      this.showFieldError('name', this.config.i18n.t('validation.name_required'));
      isValid = false;
    }

    // Validate email
    const email = formData.get('email') as string;
    if (!validateRequired(email)) {
      this.showFieldError('email', this.config.i18n.t('validation.email_required'));
      isValid = false;
    } else if (!validateEmail(email)) {
      this.showFieldError('email', this.config.i18n.t('validation.email_invalid'));
      isValid = false;
    }

    // Validate subject
    const subject = formData.get('subject') as string;
    if (!validateRequired(subject)) {
      this.showFieldError('subject', this.config.i18n.t('validation.subject_required'));
      isValid = false;
    }

    // Validate message
    const message = formData.get('message') as string;
    if (!validateRequired(message)) {
      this.showFieldError('message', this.config.i18n.t('validation.message_required'));
      isValid = false;
    }

    return isValid;
  }

  private validateField(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const name = input.name;
    const value = input.value;

    this.clearFieldError(event);

    switch (name) {
      case 'name':
        if (!validateRequired(value)) {
          this.showFieldError('name', this.config.i18n.t('validation.name_required'));
        }
        break;
      case 'email':
        if (!validateRequired(value)) {
          this.showFieldError('email', this.config.i18n.t('validation.email_required'));
        } else if (!validateEmail(value)) {
          this.showFieldError('email', this.config.i18n.t('validation.email_invalid'));
        }
        break;
      case 'subject':
        if (!validateRequired(value)) {
          this.showFieldError('subject', this.config.i18n.t('validation.subject_required'));
        }
        break;
      case 'message':
        if (!validateRequired(value)) {
          this.showFieldError('message', this.config.i18n.t('validation.message_required'));
        }
        break;
    }
  }

  private showFieldError(field: string, message: string): void {
    const errorElement = this.element.querySelector(`#error-${field}`) as HTMLElement;
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  private clearFieldError(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const field = input.name;
    const errorElement = this.element.querySelector(`#error-${field}`) as HTMLElement;
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  private clearAllErrors(): void {
    const errorElements = this.element.querySelectorAll('.ticket-widget-error');
    errorElements.forEach(element => {
      (element as HTMLElement).style.display = 'none';
    });
  }

  private render(): void {
    document.body.appendChild(this.element);
    // Ensure modal is hidden by default with proper initial state
    this.element.style.display = 'flex';
    this.element.classList.remove('ticket-widget-open', 'ticket-widget-opening', 'ticket-widget-closing');
  }

  public show(): void {
    // Remove any existing animation classes first
    this.element.classList.remove('ticket-widget-closing');
    
    // Add opening animation
    this.element.classList.add('ticket-widget-opening');
    
    // After a brief delay, add the open class for the final state
    setTimeout(() => {
      this.element.classList.remove('ticket-widget-opening');
      this.element.classList.add('ticket-widget-open');
    }, 300);
  }

  public hide(): void {
    // Remove open class and add closing animation
    this.element.classList.remove('ticket-widget-open', 'ticket-widget-opening');
    this.element.classList.add('ticket-widget-closing');
    
    // After animation completes, clean up
    setTimeout(() => {
      this.element.classList.remove('ticket-widget-closing');
      this.hideSuccess();
      this.hideError();
      this.resetForm();
    }, 300);
  }

  public setLoading(loading: boolean): void {
    this.isLoading = loading;
    const submitBtn = this.element.querySelector('#submit-btn') as HTMLButtonElement;
    const submitText = this.element.querySelector('.submit-text') as HTMLElement;
    const submitLoader = this.element.querySelector('.submit-loader') as HTMLElement;
    
    if (submitBtn && submitText && submitLoader) {
      submitBtn.disabled = loading;
      submitText.style.display = loading ? 'none' : 'inline';
      submitLoader.style.display = loading ? 'inline' : 'none';
    }
  }

  public showSuccess(ticket: TicketResponse): void {
    const form = this.element.querySelector('#ticket-widget-form') as HTMLElement;
    const successMessage = this.element.querySelector('#success-message') as HTMLElement;
    const ticketInfo = this.element.querySelector('#ticket-info') as HTMLElement;
    
    if (form && successMessage && ticketInfo) {
      form.style.display = 'none';
      successMessage.style.display = 'block';
      ticketInfo.textContent = `${this.config.i18n.t('success.ticket_number')}: ${ticket.ticket_number}`;
    }
  }

  public showError(message: string): void {
    const errorMessage = this.element.querySelector('#error-message') as HTMLElement;
    const errorText = this.element.querySelector('#error-text') as HTMLElement;
    
    if (errorMessage && errorText) {
      errorText.textContent = message;
      errorMessage.style.display = 'block';
    }
  }

  private hideSuccess(): void {
    const form = this.element.querySelector('#ticket-widget-form') as HTMLElement;
    const successMessage = this.element.querySelector('#success-message') as HTMLElement;
    
    if (form && successMessage) {
      form.style.display = 'block';
      successMessage.style.display = 'none';
    }
  }

  private hideError(): void {
    const errorMessage = this.element.querySelector('#error-message') as HTMLElement;
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
  }

  private resetForm(): void {
    const form = this.element.querySelector('#ticket-widget-form') as HTMLFormElement;
    if (form) {
      form.reset();
      this.clearAllErrors();
    }
  }

  public destroy(): void {
    this.element.remove();
  }
} 