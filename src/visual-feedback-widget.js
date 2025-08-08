/**
 * Visual Feedback Widget
 * Main entry point for the widget
 */

import VisualFeedbackModal from './components/visual-feedback-modal.js';
import './styles/main.scss';

/**
 * Default configuration for the widget
 */
const DEFAULT_CONFIG = {
  // API Configuration
  apiEndpoint: '/api/feedback',
  apiUrl: 'https://example.com/api', // Configure this with your actual API URL
  projectId: null, // Required: Your project ID
  apiKey: null,
  
  // Widget Behavior
  theme: 'default',
  position: 'bottom-right',
  showTriggerButton: true,
  triggerButtonText: 'Send Feedback',
  
  // Feature Toggles
  enableScreenshots: true,
  enableScreenRecording: true,
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  enableSystemInfo: true,
  
  // Modal Configuration
  modalTitle: 'Send Feedback',
  modalSubtitle: 'Help us improve by sharing your experience',
  
  // Callback Functions
  onOpen: null,
  onClose: null,
  onSubmit: null,
  onError: null,
  
  // Styling Options
  primaryColor: '#667eea',
  borderRadius: '8px',
  
  // Accessibility
  ariaLabel: 'Open feedback widget',
  
  // Advanced Options
  debugMode: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'video/*'],
  maxScreenshotSize: 1920 * 1080,
  
  // Internationalization
  language: 'en',
  customTexts: {}
};

/**
 * Visual Feedback Widget Class
 * Main widget class that provides the public API
 */
export default class VisualFeedbackWidget {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.modal = null;
    this.triggerButton = null;
    this.isInitialized = false;
    this.isDestroyed = false;
    
    // Validate configuration
    this.validateConfig();
    
    // Initialize widget
    this.init();
  }
  
  /**
   * Validate the configuration
   */
  validateConfig() {
    // Validate API endpoint
    if (!this.config.apiEndpoint || typeof this.config.apiEndpoint !== 'string') {
    }
    
    // Validate position
    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (!validPositions.includes(this.config.position)) {
      this.config.position = 'bottom-right';
    }
    
    // Validate theme
    const validThemes = ['default', 'dark', 'light', 'minimal'];
    if (!validThemes.includes(this.config.theme)) {
      this.config.theme = 'default';
    }
    
    // Validate callbacks
    const callbacks = ['onOpen', 'onClose', 'onSubmit', 'onError'];
    callbacks.forEach(callback => {
      if (this.config[callback] && typeof this.config[callback] !== 'function') {
        this.config[callback] = null;
      }
    });
  }
  
  /**
   * Initialize the widget
   */
  init() {
    if (this.isInitialized || this.isDestroyed) return;
    
    // Create modal component
    this.modal = new VisualFeedbackModal({
      ...this.config,
      onOpen: this.handleModalOpen.bind(this),
      onClose: this.handleModalClose.bind(this),
      onSubmit: this.handleModalSubmit.bind(this),
      onError: this.handleModalError.bind(this)
    });
    
    // Create trigger button if enabled
    if (this.config.showTriggerButton) {
      this.createTriggerButton();
    }
    
    // Add widget container class to body
    document.body.classList.add('visual-feedback-widget');
    
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    this.isInitialized = true;
    
    // Log initialization if debug mode is enabled
    if (this.config.debugMode) {
    }
  }
  
  /**
   * Create the trigger button
   */
  createTriggerButton() {
    if (this.triggerButton) {
      return;
    }
    
    this.triggerButton = document.createElement('button');
    this.triggerButton.className = 'help-button';
    this.triggerButton.innerHTML = this.config.triggerButtonText;
    this.triggerButton.setAttribute('aria-label', this.config.ariaLabel);
    this.triggerButton.style.cssText = this.getTriggerButtonStyles();
    
    // Add click handler
    this.triggerButton.addEventListener('click', () => {
      
      // Disable and hide button immediately to prevent double-clicks and screenshots
      this.disableTriggerButton();
      this.hideTriggerButton();
      
      this.open();
    });
    
    // Add to page
    document.body.appendChild(this.triggerButton);    
  }
  
  /**
   * Get trigger button styles based on position
   */
  getTriggerButtonStyles() {
    const position = this.config.position;
    const styles = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    
    return styles[position] || styles['bottom-right'];
  }

  /**
   * Disable ALL widget buttons (prevents clicks, visual feedback)
   */
  disableTriggerButton() {
    // Disable all help buttons
    const helpButtons = document.querySelectorAll('.help-button');
    helpButtons.forEach((button, index) => {
      if (button) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
      }
    });
  }

  /**
   * Enable ALL widget buttons
   */
  enableTriggerButton() {
    // Enable all help buttons
    const helpButtons = document.querySelectorAll('.help-button');
    helpButtons.forEach((button, index) => {
      if (button) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    });
  }

  /**
   * Hide ALL widget buttons (trigger button and any floating help buttons)
   */
  hideTriggerButton() {
    // Hide all help buttons (including trigger and floating buttons)
    const helpButtons = document.querySelectorAll('.help-button');
    helpButtons.forEach((button, index) => {
      if (button) {
        button.style.display = 'none';
      }
    });
  }

  /**
   * Show ALL widget buttons (trigger button and any floating help buttons)
   */
  showTriggerButton() {
    // Show all help buttons (including trigger and floating buttons)
    const helpButtons = document.querySelectorAll('.help-button');
    helpButtons.forEach((button, index) => {
      if (button) {
        button.style.display = 'block';
      }
    });
  }
  
  /**
   * Set up keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + F to open feedback
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault();
        this.open();
      }
    });
  }
  
  /**
   * Open the feedback modal
   */
  open() {
    if (this.isDestroyed || !this.modal) {
      return;
    }
    
    this.modal.show();
  }
  
  /**
   * Show the feedback modal (alias for open)
   */
  show() {
    this.open();
  }
  
  /**
   * Close the feedback modal
   */
  close() {
    if (this.isDestroyed || !this.modal) return;
    
    this.modal.hide();
  }
  
  /**
   * Hide the feedback modal (alias for close)
   */
  hide() {
    this.close();
  }
  
  /**
   * Toggle the feedback modal
   */
  toggle() {
    if (this.isDestroyed || !this.modal) return;
    
    if (this.modal.isVisible) {
      this.close();
    } else {
      this.open();
    }
  }
  
  /**
   * Check if the modal is currently open
   */
  isOpen() {
    return this.modal && this.modal.isVisible;
  }
  
  /**
   * Update widget configuration
   */
  updateConfig(newConfig) {
    if (this.isDestroyed) return;
    
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
    
    // Update modal if it exists
    if (this.modal) {
      this.modal.updateConfig(this.config);
    }
    
    // Update trigger button if needed
    if (this.triggerButton) {
      this.triggerButton.innerHTML = this.config.triggerButtonText;
      this.triggerButton.setAttribute('aria-label', this.config.ariaLabel);
    }
    
    if (this.config.debugMode) {
  
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Handle modal open event
   */
  handleModalOpen() {
    if (this.config.onOpen) {
      this.config.onOpen();
    }
    
    if (this.config.debugMode) {
  
    }
  }
  
  /**
   * Handle modal close event
   */
  handleModalClose() {
    // Re-enable and show the trigger button when modal closes
    this.enableTriggerButton();
    this.showTriggerButton();
    
    if (this.config.onClose) {
      this.config.onClose();
    }
    
    if (this.config.debugMode) {
  
    }
  }
  
  /**
   * Handle modal submit event
   */
  handleModalSubmit(data) {
    if (this.config.onSubmit) {
      this.config.onSubmit(data);
    }
    
    if (this.config.debugMode) {
  
    }
  }
  
  /**
   * Handle modal error event
   */
  handleModalError(error) {
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    if (this.config.debugMode) {
    }
  }
  
  /**
   * Show the trigger button
   */
  showTriggerButton() {
    if (this.triggerButton) {
      this.triggerButton.style.display = 'block';
    } else if (this.config.showTriggerButton) {
      this.createTriggerButton();
    }
  }
  
  /**
   * Hide the trigger button
   */
  hideTriggerButton() {
    if (this.triggerButton) {
      this.triggerButton.style.display = 'none';
    }
  }
  
  /**
   * Enable a specific feature
   */
  enableFeature(feature) {
    const features = {
      screenshots: 'enableScreenshots',
      recording: 'enableScreenRecording',
      console: 'enableConsoleLogging',
      network: 'enableNetworkLogging',
      systemInfo: 'enableSystemInfo'
    };
    
    if (features[feature]) {
      this.updateConfig({ [features[feature]]: true });
    }
  }
  
  /**
   * Disable a specific feature
   */
  disableFeature(feature) {
    const features = {
      screenshots: 'enableScreenshots',
      recording: 'enableScreenRecording',
      console: 'enableConsoleLogging',
      network: 'enableNetworkLogging',
      systemInfo: 'enableSystemInfo'
    };
    
    if (features[feature]) {
      this.updateConfig({ [features[feature]]: false });
    }
  }
  
  /**
   * Get widget version
   */
  getVersion() {
    return '1.0.0';
  }
  
  /**
   * Capture screenshot programmatically
   */
  captureScreenshot() {
    if (this.isDestroyed || !this.modal) return;
    
    this.modal.show();
  }
  
  /**
   * Start recording programmatically
   */
  startRecording() {
    if (this.isDestroyed || !this.modal) return;
    
    this.modal.show();
    // Recording will be available in the modal
  }
  
  /**
   * Get system information
   */
  getSystemInfo() {
    if (this.isDestroyed || !this.modal || !this.modal.components.systemInfo) {
      return {
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };
    }
    
    return this.modal.components.systemInfo.gather();
  }
  
  /**
   * Get widget status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      destroyed: this.isDestroyed,
      modalOpen: this.isOpen(),
      config: this.getConfig(),
      version: this.getVersion()
    };
  }
  
  /**
   * Reset the widget to initial state
   */
  reset() {
    if (this.isDestroyed) return;
    
    this.close();
    
    if (this.modal) {
      this.modal.reset();
    }
    
    if (this.config.debugMode) {
  
    }
  }
  
  /**
   * Destroy the widget and clean up
   */
  destroy() {
    if (this.isDestroyed) return;
    
    // Close modal if open
    this.close();
    
    // Remove trigger button
    if (this.triggerButton && this.triggerButton.parentNode) {
      this.triggerButton.parentNode.removeChild(this.triggerButton);
      this.triggerButton = null;
    }
    
    // Destroy modal
    if (this.modal) {
      this.modal.destroy();
      this.modal = null;
    }
    
    // Remove widget class from body
    document.body.classList.remove('visual-feedback-widget');
    
    // Mark as destroyed
    this.isDestroyed = true;
    this.isInitialized = false;
    
    if (this.config.debugMode) {
  
    }
  }
}

// Static methods for convenience
VisualFeedbackWidget.create = function(config) {
  return new VisualFeedbackWidget(config);
};

VisualFeedbackWidget.version = '1.0.0';

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualFeedbackWidget;
}

if (typeof window !== 'undefined') {
  window.VisualFeedbackWidget = VisualFeedbackWidget;
} 