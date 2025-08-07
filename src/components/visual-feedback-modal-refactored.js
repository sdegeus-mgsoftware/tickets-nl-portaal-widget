/**
 * Visual Feedback Modal Component - Refactored
 * Main orchestrator for the visual feedback widget (modular version)
 */

import ScreenshotCapture from './screenshot-capture.js';
import StepReplication from './step-replication.js';
import ChatInterface from './chat-interface.js';
import SystemInfo from './system-info.js';
import ConsoleLogger from './console-logger.js';
import LoginForm from './login-form.js';

// Import handlers
import AuthenticationHandler from './handlers/authentication-handler.js';
import TabController from './handlers/tab-controller.js';
import DataCollector from './handlers/data-collector.js';
import SubmissionHandler from './handlers/submission-handler.js';
import RecordingController from './handlers/recording-controller.js';

export default class VisualFeedbackModal {
  constructor(options = {}) {    
    this.options = {
      apiEndpoint: '/api/feedback',
      theme: 'default',
      enableScreenRecording: false,
      enableConsoleLogging: true,
      enableNetworkLogging: true,
      apiUrl: 'https://example.com/api', // Configure this with your actual API URL
      organizationId: null, // Configure organization ID
      projectId: null, // Configure project ID
      createTickets: true, // Create tickets instead of generic feedback
      onOpen: null,
      onClose: null,
      onSubmit: null,
      ...options
    };

    this.isVisible = false;
    this.components = {};
    this.floatingButton = null;
    this.modalElement = null;
    this.floatingStopButton = null;
    
    // Store original styles to restore later
    this.originalBodyStyles = null;
    this.originalHtmlStyles = null;

    // Initialize handlers
    this.authHandler = new AuthenticationHandler(this.options);
    this.submissionHandler = new SubmissionHandler(this.options);
    
    // These will be initialized after modal elements are created
    this.tabController = null;
    this.dataCollector = null;
    this.recordingController = null;

    this.init();
  }

  /**
   * Initialize the modal and all its components
   */
  init() {
    this.createModalElements();
    this.initializeComponents();
    this.initializeHandlers();
    this.setupEventListeners();
    this.createFloatingButton();
    this.createFloatingStopButton();
  }

  /**
   * Create the main modal structure
   */
  createModalElements() {
    // Create modal container
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'visual-feedback-modal';
    this.modalElement.id = 'visualFeedbackModal';
    this.modalElement.style.display = 'none';

    // Create modal content with login screen
    this.modalElement.innerHTML = `
      <div class="visual-feedback-content">
        <div class="visual-feedback-header">
          <h3>Visual Feedback</h3>
          <div class="header-actions">
            <button class="visual-feedback-signout" id="vfwSignoutBtn" style="display: none;" title="Sign out">Sign out</button>
            <button class="visual-feedback-close" id="vfwCloseBtn">×</button>
          </div>
        </div>
        
        <div class="visual-feedback-body">
          <!-- Login Screen -->
          <div class="login-screen" id="loginScreen" style="display: none;">
            <!-- Login form will be injected here -->
          </div>
          
          <!-- Loading Screen -->
          <div class="screenshot-loading" id="screenshotLoading">
            <div class="loading-spinner"></div>
            <p id="loadingText">Preparing to capture...</p>
          </div>
          
          <!-- Main Feedback Interface -->
          <div class="feedback-main" id="feedbackMain" style="display: none;">
            <div class="screenshot-panel" id="screenshotPanel">
              <!-- Screenshot capture component will be injected here -->
            </div>
            
            <div class="tabbed-panel" id="tabbedPanel">
              <!-- Tabbed interface for right side -->
              <div class="tab-header">
                <button class="tab-btn active" data-tab="chat">💬 Chat</button>
                <button class="tab-btn" data-tab="system">💻 System Info</button>
                <button class="tab-btn" data-tab="console">🖥️ Console Logs</button>
                <button class="tab-btn" data-tab="network">🌐 Network Log</button>
              </div>
              
              <div class="tab-content">
                <div class="tab-panel active" id="chatTab">
                  <!-- Chat interface component will be injected here -->
                </div>
                
                <div class="tab-panel" id="systemTab">
                  <!-- System info component will be injected here -->
                </div>
                
                <div class="tab-panel" id="consoleTab">
                  <!-- Console logs component will be injected here -->
                </div>
                
                <div class="tab-panel" id="networkTab">
                  <!-- Network logs will be injected here -->
                </div>
              </div>
              
              <!-- Submit button - visible across all tabs -->
              <div class="tab-footer">
                <button class="submit-btn" id="globalSubmitButton">📤 Submit Feedback</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to document
    document.body.appendChild(this.modalElement);
  }

  /**
   * Initialize all sub-components
   */
  initializeComponents() {
    const loginScreen = this.modalElement.querySelector('#loginScreen');
    const screenshotPanel = this.modalElement.querySelector('#screenshotPanel');
    const chatTab = this.modalElement.querySelector('#chatTab');
    const consoleTab = this.modalElement.querySelector('#consoleTab');

    // Initialize login form
    this.components.loginForm = new LoginForm({
      container: loginScreen,
      apiUrl: this.options.apiUrl,
      onLogin: this.handleLogin.bind(this),
      onCancel: this.hide.bind(this)
    });

    // Initialize screenshot capture
    this.components.screenshotCapture = new ScreenshotCapture({
      container: screenshotPanel,
      onAnnotationChange: this.handleAnnotationChange.bind(this)
    });

    // Initialize chat interface
    this.components.chatInterface = new ChatInterface({
      container: chatTab,
      onSendMessage: this.handleSendMessage.bind(this),
      onSubmit: this.handleSubmit.bind(this)
    });

    // Initialize system info display
    this.components.systemInfo = new SystemInfo({
      enableConsoleLogging: this.options.enableConsoleLogging,
      enableNetworkLogging: this.options.enableNetworkLogging
    });

    // Initialize step replication if screen recording is enabled
    if (this.options.enableScreenRecording) {
      this.components.stepReplication = new StepReplication({
        onRecordingStart: this.handleRecordingStart.bind(this),
        onRecordingStop: this.handleRecordingStop.bind(this),
        onStepAdded: this.handleStepAdded.bind(this)
      });
    }

    // Initialize console logger if enabled
    if (this.options.enableConsoleLogging) {
      this.components.consoleLogger = new ConsoleLogger({
        container: consoleTab,
        onLogsCaptured: this.handleLogsCaptured.bind(this)
      });
    }
  }

  /**
   * Initialize handlers
   */
  initializeHandlers() {
    // Initialize tab controller
    this.tabController = new TabController(this.modalElement, this.components);
    
    // Initialize data collector
    this.dataCollector = new DataCollector(this.components, this.modalElement);
    
    // Initialize recording controller if screen recording is enabled
    if (this.options.enableScreenRecording) {
      this.recordingController = new RecordingController(
        this.components, 
        this.modalElement, 
        this.floatingStopButton
      );
    }

    // Setup authentication
    this.authHandler.onStateChange((authState) => {
      if (this.isVisible && !authState.isAuthenticated) {
        // Show login screen if user becomes unauthenticated while modal is open
        this.showLoginScreen();
      }
    });

    this.authHandler.initialize();

    // Setup global submit button
    this.setupGlobalSubmitButton();
  }

  /**
   * Setup global submit button
   */
  setupGlobalSubmitButton() {
    const globalSubmitButton = this.modalElement.querySelector('#globalSubmitButton');
    if (globalSubmitButton) {
      globalSubmitButton.addEventListener('click', () => {
        this.handleSubmit();
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    const closeBtn = this.modalElement.querySelector('#vfwCloseBtn');
    closeBtn.addEventListener('click', this.hide.bind(this));

    // Signout button
    const signoutBtn = this.modalElement.querySelector('#vfwSignoutBtn');
    signoutBtn.addEventListener('click', this.handleSignout.bind(this));

    // Click outside to close
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.hide();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Create floating help button
   */
  createFloatingButton() {
    this.floatingButton = document.createElement('button');
    this.floatingButton.className = 'help-button';
    this.floatingButton.innerHTML = 'Need Help? 🎯';
    this.floatingButton.title = 'Click to take screenshot and report issue';
    this.floatingButton.addEventListener('click', this.show.bind(this));
    
    document.body.appendChild(this.floatingButton);
  }

  /**
   * Create floating stop recording button
   */
  createFloatingStopButton() {
    this.floatingStopButton = document.createElement('button');
    this.floatingStopButton.className = 'stop-recording-floating';
    this.floatingStopButton.id = 'stopRecordingFloating';
    this.floatingStopButton.style.display = 'none';
    this.floatingStopButton.title = 'Stop step recording and return to feedback form';
    this.floatingStopButton.innerHTML = `
      <span class="recording-pulse"></span>
      <span class="stop-icon">🔴</span>
      <span class="stop-text">Stop Recording</span>
    `;
    this.floatingStopButton.addEventListener('click', this.stopRecording.bind(this));
    
    document.body.appendChild(this.floatingStopButton);
  }

  /**
   * Handle login form submission
   */
  async handleLogin(credentials) {
    const result = await this.authHandler.handleLogin(credentials);
    
    if (result.success) {
      // Hide login screen and proceed with normal flow
      await this.proceedWithFeedbackCapture();
    }
    
    return result;
  }

  /**
   * Handle signout
   */
  async handleSignout() {
    await this.authHandler.handleLogout();
    
    // Hide signout button
    const signoutBtn = this.modalElement.querySelector('#vfwSignoutBtn');
    if (signoutBtn) {
      signoutBtn.style.display = 'none';
    }
    
    // Show login screen
    this.showLoginScreen();
  }

  /**
   * Show login screen
   */
  showLoginScreen() {
    const loginScreen = this.modalElement.querySelector('#loginScreen');
    const loadingElement = this.modalElement.querySelector('#screenshotLoading');
    const mainElement = this.modalElement.querySelector('#feedbackMain');

    if (loginScreen) {
      loginScreen.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      `;
    }

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }

    if (mainElement) {
      mainElement.style.cssText = `
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      `;
    }

    // Focus on login form
    if (this.components.loginForm) {
      this.components.loginForm.focus();
    }
  }

  /**
   * Proceed with normal feedback capture flow after authentication
   */
  async proceedWithFeedbackCapture() {
    const loginScreen = this.modalElement.querySelector('#loginScreen');
    const loadingElement = this.modalElement.querySelector('#screenshotLoading');
    const mainElement = this.modalElement.querySelector('#feedbackMain');

    // Hide login screen completely
    if (loginScreen) {
      loginScreen.style.display = 'none';
      loginScreen.style.visibility = 'hidden';
      loginScreen.style.opacity = '0';
      loginScreen.style.pointerEvents = 'none';
    }

    // Show loading while taking screenshot
    if (loadingElement) {
      loadingElement.style.display = 'flex';
    }

    try {
      // Initialize system info
      const systemInfo = await this.components.systemInfo.gather();
      this.tabController.setCachedSystemInfo(systemInfo);
      
      // Initialize chat with system info
      this.components.chatInterface.initialize(systemInfo);

      // Hide loading and show main content
      if (loadingElement) {
        loadingElement.style.display = 'none';
      }
      
      if (mainElement) {
        mainElement.style.cssText = `
          display: flex !important;
          flex: 1 !important;
          flex-direction: row !important;
          overflow: hidden !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        `;
      }

      // Show signout button
      const signoutBtn = this.modalElement.querySelector('#vfwSignoutBtn');
      if (signoutBtn) {
        signoutBtn.style.display = 'block';
      }

      // Center the canvas
      await new Promise(resolve => setTimeout(resolve, 50));
      if (this.components.screenshotCapture) {
        this.components.screenshotCapture.centerCanvasWhenReady();
      }

    } catch (error) {
      console.error('Error proceeding with feedback capture:', error);
      this.showLoginScreen(); // Fall back to login screen
    }
  }

  /**
   * Show the modal
   */
  async show() {
    if (this.isVisible) {
      return;
    }

    // Check authentication first
    const isAuthenticated = await this.authHandler.validateSession();

    // Always take screenshot immediately, regardless of authentication status
    this.showScreenshotLoadingIndicator();
    
    // Wait a moment for any animations to settle
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Take screenshot and WAIT for it to complete
    try {
      await this.components.screenshotCapture.takeScreenshot();
      
      // Additional wait to ensure screenshot processing is complete
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error taking screenshot:', error);
      this.hideScreenshotLoadingIndicator();
      return;
    }
    
    // Hide loading indicator
    this.hideScreenshotLoadingIndicator();
    
    // Show the modal
    this.isVisible = true;
    
    // Store original body and html styles before any modifications
    this.originalBodyStyles = document.body.getAttribute('style') || '';
    this.originalHtmlStyles = document.documentElement.getAttribute('style') || '';
    
    // Apply modal styles
    this.applyModalStyles();
    
    try {
      // Check authentication and show appropriate screen
      if (isAuthenticated) {
        // User is authenticated, proceed with normal flow
        await this.proceedWithFeedbackCapture();
      } else {
        // User is not authenticated, show login screen
        this.showLoginScreen();
      }

      // Trigger callback
      if (this.options.onOpen) {
        this.options.onOpen();
      }

    } catch (error) {
      console.error('Error showing visual feedback modal:', error);
      this.hide();
    }
  }

  /**
   * Apply modal styles
   */
  applyModalStyles() {
    // Apply minimal body styles - only prevent scrolling, don't change layout
    const currentBodyStyle = document.body.getAttribute('style') || '';
    document.body.setAttribute('style', currentBodyStyle + '; overflow: hidden !important;');
    
    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 9999999 !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(5px) !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      box-sizing: border-box !important;
    `;
    
    // Content container - Fuller screen modal window
    const contentContainer = this.modalElement.querySelector('.visual-feedback-content');
    if (contentContainer) {
      contentContainer.style.cssText = `
        background: white !important;
        border-radius: 8px !important;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3) !important;
        width: 98vw !important;
        height: 95vh !important;
        max-width: none !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        position: relative !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 10000000 !important;
      `;
    }
    
    // Ensure the modal body can expand to fill available space
    const modalBody = this.modalElement.querySelector('.visual-feedback-body');
    if (modalBody) {
      modalBody.style.cssText = `
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      `;
    }
  }

  /**
   * Hide the modal
   */
  hide() {
    if (!this.isVisible) return;

    // Stop any active recording
    if (this.recordingController && this.recordingController.isRecordingActive()) {
      this.recordingController.stopRecording();
    }

    this.isVisible = false;
    this.modalElement.style.display = 'none';
    
    // Restore original body and html styles
    if (this.originalBodyStyles !== null) {
      document.body.setAttribute('style', this.originalBodyStyles);
    } else {
      document.body.removeAttribute('style');
    }
    if (this.originalHtmlStyles !== null) {
      document.documentElement.setAttribute('style', this.originalHtmlStyles);
    } else {
      document.documentElement.removeAttribute('style');
    }
    
    // Reset components
    this.components.screenshotCapture?.reset();
    this.components.chatInterface?.reset();
    this.recordingController?.reset();
    
    // Hide floating stop button
    this.floatingStopButton.style.display = 'none';
    
    // Trigger callback
    if (this.options.onClose) {
      this.options.onClose();
    }
  }

  /**
   * Start recording steps
   */
  async startRecording() {
    if (!this.recordingController) {
      alert('Screen recording is not enabled. Please enable it in the widget configuration.');
      return;
    }

    const result = await this.recordingController.startRecording();
    if (!result.success) {
      alert(result.error);
    }
  }

  /**
   * Stop recording steps
   */
  stopRecording() {
    if (this.recordingController) {
      this.recordingController.stopRecording();
    }
  }

  /**
   * Submit feedback
   */
  async handleSubmit() {
    try {
      console.log('🚀 Starting feedback submission...');
      
      // Check authentication first
      const authState = this.authHandler.getState();
      if (!authState.isAuthenticated) {
        throw new Error('You must be logged in to submit feedback');
      }

      // Collect all feedback data
      const feedbackData = this.dataCollector.collectFeedbackData();

      // Extract user message for ticket title and description
      const userMessages = feedbackData.chatMessages.filter(m => m.type === 'user');
      const title = this.dataCollector.extractTitle(feedbackData.chatMessages);
      const description = this.dataCollector.buildTicketDescription(feedbackData, userMessages);

      // Create ticket if enabled, otherwise use legacy feedback endpoint
      let result;
      if (this.options.createTickets) {
        // Prepare ticket data
        const ticketData = this.dataCollector.formatTicketData(
          feedbackData, 
          title, 
          description, 
          authState.user.id
        );

        result = await this.submissionHandler.submitTicket(ticketData);
        
        if (result.success) {
          this.submissionHandler.showTicketSuccessMessage(result.ticket, feedbackData, () => {
            this.hide();
          });
        } else {
          throw new Error(result.error);
        }
      } else {
        // Legacy feedback submission
        result = await this.submissionHandler.submitLegacyFeedback(feedbackData);
        
        if (result.success) {
          this.submissionHandler.showLegacySuccessMessage(feedbackData, () => {
            this.hide();
          });
        } else {
          throw new Error(result.error);
        }
      }

      // Trigger callback
      if (this.options.onSubmit) {
        this.options.onSubmit({
          ...feedbackData,
          ticket: result?.ticket
        });
      }

    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      this.submissionHandler.showErrorMessage(error.message);
    }
  }

  /**
   * Show/hide screenshot loading indicator
   */
  showScreenshotLoadingIndicator() {
    // Remove any existing indicator
    this.hideScreenshotLoadingIndicator();
    
    this.screenshotLoader = document.createElement('div');
    this.screenshotLoader.id = 'screenshotLoadingIndicator';
    this.screenshotLoader.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 999999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <div style="
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        📸 Taking screenshot...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    
    document.body.appendChild(this.screenshotLoader);
  }

  hideScreenshotLoadingIndicator() {
    if (this.screenshotLoader) {
      this.screenshotLoader.remove();
      this.screenshotLoader = null;
    }
  }

  // Event handlers for component communication
  handleAnnotationChange(annotations) {
    // Handle annotation changes if needed
  }

  handleRecordingStart() {
    // Handle recording start
  }

  handleRecordingStop(recordingData) {
    // Handle recording stop
  }

  handleStepAdded(step) {
    // Handle step addition
  }

  handleSendMessage(message) {
    // Handle chat message sending
  }

  handleLogsCaptured(logs) {
    // Handle logs captured
  }

  /**
   * Destroy the modal and clean up
   */
  destroy() {
    // Clean up handlers
    this.authHandler?.destroy();
    this.recordingController?.destroy();

    // Clean up components
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });

    // Remove elements
    if (this.modalElement) {
      this.modalElement.remove();
    }
    if (this.floatingButton) {
      this.floatingButton.remove();
    }
    if (this.floatingStopButton) {
      this.floatingStopButton.remove();
    }
  }
}