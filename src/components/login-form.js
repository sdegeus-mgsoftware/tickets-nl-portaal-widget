/**
 * Login Form Component
 * Simple authentication form for the widget modal
 */

export default class LoginForm {
  constructor(options = {}) {
    this.options = {
      container: null,
      onLogin: null,
      onCancel: null,
      apiUrl: '',
      ...options
    };

    this.isLoading = false;
    this.formElement = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.submitButton = null;
    this.cancelButton = null;
    this.errorElement = null;
    this.loadingElement = null;

    this.init();
  }

  /**
   * Initialize the login form
   */
  init() {
    this.createElements();
    this.setupEventListeners();
  }

  /**
   * Create the login form elements
   */
  createElements() {
    if (!this.options.container) {
      throw new Error('Container is required for LoginForm');
    }

    this.options.container.innerHTML = `
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="login-title">
            <h1>Welcome back</h1>
            <p>Please sign in to submit feedback to the ticket portal</p>
          </div>
        </div>
        
        <div class="login-error" id="loginError" style="display: none;">
          <div class="error-content">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span class="error-message"></span>
          </div>
        </div>
        
        <form class="login-form" id="loginForm">
          <div class="form-field">
            <label for="loginEmail" class="field-label">Email</label>
            <input 
              type="email" 
              id="loginEmail" 
              name="email" 
              placeholder="Enter your email address"
              required
              autocomplete="email"
              class="field-input"
            >
          </div>
          
          <div class="form-field">
            <label for="loginPassword" class="field-label">Password</label>
            <div class="password-field">
              <input 
                type="password" 
                id="loginPassword" 
                name="password" 
                placeholder="Enter your password"
                required
                autocomplete="current-password"
                class="field-input password-input"
              >
              <button type="button" class="password-toggle" id="passwordToggle">
                <svg class="eye-icon show-password" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg class="eye-icon hide-password" style="display: none;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancelButton">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" id="submitButton">
              <span class="btn-content">
                <svg class="btn-icon login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10,17 15,12 10,7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                <span class="btn-text">Sign In</span>
              </span>
              <span class="btn-loading" style="display: none;">
                <div class="loading-spinner"></div>
                <span>Signing in...</span>
              </span>
            </button>
          </div>
        </form>
        
        <div class="login-footer">
          <p>Don't have access? Contact your system administrator</p>
        </div>
      </div>
    `;

    // Get references to elements
    this.formElement = this.options.container.querySelector('#loginForm');
    this.emailInput = this.options.container.querySelector('#loginEmail');
    this.passwordInput = this.options.container.querySelector('#loginPassword');
    this.submitButton = this.options.container.querySelector('#submitButton');
    this.cancelButton = this.options.container.querySelector('#cancelButton');
    this.errorElement = this.options.container.querySelector('#loginError');
    this.passwordToggle = this.options.container.querySelector('#passwordToggle');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Cancel button
    this.cancelButton.addEventListener('click', () => {
      if (this.options.onCancel) {
        this.options.onCancel();
      }
    });

    // Password toggle
    this.passwordToggle.addEventListener('click', () => {
      this.togglePasswordVisibility();
    });

    // Enter key on inputs
    [this.emailInput, this.passwordInput].forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !this.isLoading) {
          this.handleSubmit();
        }
      });
    });

    // Clear error when user starts typing
    [this.emailInput, this.passwordInput].forEach(input => {
      input.addEventListener('input', () => {
        this.clearError();
      });
    });

    // Ensure inputs are properly configured
    [this.emailInput, this.passwordInput].forEach(input => {
      if (input) {
        input.disabled = false;
        input.readOnly = false;
        input.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (this.isLoading) return;

    const email = this.emailInput.value.trim();
    const password = this.passwordInput.value;

    // Basic validation
    if (!email || !password) {
      this.showError('Please fill in all fields');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    this.setLoading(true);
    this.clearError();

    try {
      // Call the login callback
      if (this.options.onLogin) {
        const result = await this.options.onLogin({ email, password });
        
        if (!result.success) {
          this.showError(result.error || 'Login failed. Please check your credentials.');
        }
        // Success is handled by the parent component
      }
    } catch (error) {
      this.showError('An unexpected error occurred. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility() {
    const isPassword = this.passwordInput.type === 'password';
    this.passwordInput.type = isPassword ? 'text' : 'password';
    
    const showIcon = this.passwordToggle.querySelector('.show-password');
    const hideIcon = this.passwordToggle.querySelector('.hide-password');
    
    if (isPassword) {
      showIcon.style.display = 'none';
      hideIcon.style.display = 'block';
    } else {
      showIcon.style.display = 'block';
      hideIcon.style.display = 'none';
    }
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    
    const btnContent = this.submitButton.querySelector('.btn-content');
    const btnLoading = this.submitButton.querySelector('.btn-loading');
    
    if (loading) {
      btnContent.style.display = 'none';
      btnLoading.style.display = 'flex';
      this.submitButton.disabled = true;
      this.cancelButton.disabled = true;
      this.emailInput.disabled = true;
      this.passwordInput.disabled = true;
    } else {
      btnContent.style.display = 'flex';
      btnLoading.style.display = 'none';
      this.submitButton.disabled = false;
      this.cancelButton.disabled = false;
      this.emailInput.disabled = false;
      this.passwordInput.disabled = false;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorMessage = this.errorElement.querySelector('.error-message');
    errorMessage.textContent = message;
    this.errorElement.style.display = 'flex';
    
    // Add shake animation
    this.errorElement.classList.add('shake');
    setTimeout(() => {
      this.errorElement.classList.remove('shake');
    }, 500);
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorElement.style.display = 'none';
  }

  /**
   * Basic email validation
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Focus on email input
   */
  focus() {
    if (this.emailInput) {
      this.emailInput.focus();
    }
  }

  /**
   * Reset form
   */
  reset() {
    if (this.formElement) {
      this.formElement.reset();
    }
    this.clearError();
    this.setLoading(false);
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    if (this.formElement) {
      this.formElement.removeEventListener('submit', this.handleSubmit);
    }
    
    // Clear references
    this.formElement = null;
    this.emailInput = null;
    this.passwordInput = null;
    this.submitButton = null;
    this.cancelButton = null;
    this.errorElement = null;
  }
}