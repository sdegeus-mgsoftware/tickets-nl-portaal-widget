/**
 * Visual Feedback Modal Component
 * Main orchestrator for the visual feedback widget
 */

import ScreenshotCapture from './screenshot-capture.js';
import StepReplication from './step-replication.js';
import ChatInterface from './chat-interface.js';
import SystemInfo from './system-info.js';
import ConsoleLogger from './console-logger.js';

export default class VisualFeedbackModal {
  constructor(options = {}) {
    this.options = {
      apiEndpoint: '/api/feedback',
      theme: 'default',
      enableScreenRecording: true,
      enableConsoleLogging: true,
      enableNetworkLogging: true,
      onOpen: null,
      onClose: null,
      onSubmit: null,
      ...options
    };

    this.isVisible = false;
    this.isRecording = false;
    this.components = {};
    this.floatingButton = null;
    this.modalElement = null;
    this.floatingStopButton = null;
    
    // Store original styles to restore later
    this.originalBodyStyles = null;
    this.originalHtmlStyles = null;

    this.init();
  }

  /**
   * Initialize the modal and all its components
   */
  init() {
    this.createModalElements();
    this.initializeComponents();
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

    // Create modal content
    this.modalElement.innerHTML = `
      <div class="visual-feedback-content">
        <div class="visual-feedback-header">
          <h3>Visual Feedback</h3>
          <button class="visual-feedback-close" id="vfwCloseBtn">×</button>
        </div>
        
        <div class="visual-feedback-body">
          <div class="screenshot-loading" id="screenshotLoading">
            <div class="loading-spinner"></div>
            <p id="loadingText">Preparing to capture...</p>
          </div>
          
          <div class="feedback-main" id="feedbackMain" style="display: none;">
            <div class="screenshot-panel" id="screenshotPanel">
              <!-- Screenshot capture component will be injected here -->
            </div>
            
            <div class="chat-panel" id="chatPanel">
              <!-- Chat interface component will be injected here -->
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
    const screenshotPanel = this.modalElement.querySelector('#screenshotPanel');
    const chatPanel = this.modalElement.querySelector('#chatPanel');

    // Initialize screenshot capture
    this.components.screenshotCapture = new ScreenshotCapture({
      container: screenshotPanel,
      onAnnotationChange: this.handleAnnotationChange.bind(this)
    });

    // Initialize step replication
    this.components.stepReplication = new StepReplication({
      onRecordingStart: this.handleRecordingStart.bind(this),
      onRecordingStop: this.handleRecordingStop.bind(this),
      onStepAdded: this.handleStepAdded.bind(this)
    });

    // Initialize chat interface
    this.components.chatInterface = new ChatInterface({
      container: chatPanel,
      onSendMessage: this.handleSendMessage.bind(this),
      onSubmit: this.handleSubmit.bind(this)
    });

    // Initialize system info
    this.components.systemInfo = new SystemInfo({
      enableConsoleLogging: this.options.enableConsoleLogging,
      enableNetworkLogging: this.options.enableNetworkLogging
    });

    // Initialize console logger if enabled
    if (this.options.enableConsoleLogging) {
      this.components.consoleLogger = new ConsoleLogger({
        onLogsCaptured: this.handleLogsCaptured.bind(this)
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
   * Show a temporary loading indicator on the page while taking screenshot
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

  /**
   * Hide the screenshot loading indicator
   */
  hideScreenshotLoadingIndicator() {
    if (this.screenshotLoader) {
      this.screenshotLoader.remove();
      this.screenshotLoader = null;
    }
  }

  /**
   * Show the modal
   */
  async show() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    console.log(`🚀 ${timestamp()} [SHOW] ========== MODAL SHOW PROCESS STARTED ==========`);
    
    if (this.isVisible) {
      console.log(`🔍 ${timestamp()} [SHOW] Modal already visible, returning`);
      return;
    }

    // Step 1: Show temporary loading indicator on page BEFORE taking screenshot
    console.log(`📸 ${timestamp()} [STEP-1] Showing screenshot loading indicator...`);
    this.showScreenshotLoadingIndicator();
    console.log(`📸 ${timestamp()} [STEP-1] Loading indicator displayed`);
    
    // Step 2: Wait a moment for any animations to settle
    console.log(`📸 ${timestamp()} [STEP-2] Waiting 200ms for layout to stabilize...`);
    const waitStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`📸 ${timestamp()} [STEP-2] Layout stabilization complete (${Date.now() - waitStart}ms)`);
    
    // Step 3: Take screenshot and WAIT for it to complete
    console.log(`📸 ${timestamp()} [STEP-3] Starting screenshot capture...`);
    const screenshotStart = Date.now();
    try {
      await this.components.screenshotCapture.takeScreenshot();
      console.log(`📸 ${timestamp()} [STEP-3] Screenshot captured successfully! (${Date.now() - screenshotStart}ms)`);
      
      // Additional wait to ensure screenshot processing is complete
      console.log(`📸 ${timestamp()} [STEP-3] Waiting 300ms for screenshot processing...`);
      const processStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`📸 ${timestamp()} [STEP-3] Screenshot processing complete! (${Date.now() - processStart}ms)`);
    } catch (error) {
      console.error(`❌ ${timestamp()} [STEP-3] Error taking screenshot:`, error);
      this.hideScreenshotLoadingIndicator();
      return;
    }
    
    // Step 4: Hide loading indicator
    console.log(`📸 ${timestamp()} [STEP-4] Hiding screenshot loading indicator...`);
    this.hideScreenshotLoadingIndicator();
    console.log(`📸 ${timestamp()} [STEP-4] Loading indicator hidden`);
    
    // Step 5: NOW show the modal
    console.log(`🔧 ${timestamp()} [STEP-5] Now showing modal with captured screenshot...`);

    console.log(`🔧 ${timestamp()} [STEP-5] Setting isVisible = true`);
    this.isVisible = true;
    
    // Store original body and html styles before any modifications
    console.log(`🔧 ${timestamp()} [STEP-5] Storing original body/html styles...`);
    this.originalBodyStyles = document.body.getAttribute('style') || '';
    this.originalHtmlStyles = document.documentElement.getAttribute('style') || '';
    console.log(`🔧 ${timestamp()} [STEP-5] Original styles stored`);
    
    // Apply minimal body styles - only prevent scrolling, don't change layout
    console.log(`🔧 ${timestamp()} [STEP-5] Applying body styles (overflow hidden)...`);
    const currentBodyStyle = document.body.getAttribute('style') || '';
    document.body.setAttribute('style', currentBodyStyle + '; overflow: hidden !important;');
    console.log(`🔧 ${timestamp()} [STEP-5] Body styles applied`);
    
    // Modal container - Clean overlay approach
    console.log(`🔧 ${timestamp()} [STEP-5] Applying modal overlay styles...`);
    const modalStyleStart = Date.now();
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
    console.log(`🔧 ${timestamp()} [STEP-5] Modal overlay styles applied (${Date.now() - modalStyleStart}ms)`);
    
    const modalRect = this.modalElement.getBoundingClientRect();
    console.log(`🔧 ${timestamp()} [STEP-5] Modal rect:`, {
      x: modalRect.x,
      y: modalRect.y, 
      width: modalRect.width,
      height: modalRect.height
    });
    
    // Content container - Fuller screen modal window
    console.log(`🔧 ${timestamp()} [STEP-5] Styling content container...`);
    const contentContainer = this.modalElement.querySelector('.visual-feedback-content');
    if (contentContainer) {
      const contentStyleStart = Date.now();
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
      console.log(`🔧 ${timestamp()} [STEP-5] Content container styled (${Date.now() - contentStyleStart}ms)`);
      
      const contentRect = contentContainer.getBoundingClientRect();
      console.log(`🔧 ${timestamp()} [STEP-5] Content container rect:`, {
        x: contentRect.x,
        y: contentRect.y,
        width: contentRect.width,
        height: contentRect.height
      });
    }
    
    // Ensure the modal body can expand to fill available space
    console.log(`🔧 ${timestamp()} [STEP-5] Styling modal body...`);
    const modalBody = this.modalElement.querySelector('.visual-feedback-body');
    if (modalBody) {
      modalBody.style.cssText = `
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      `;
      console.log(`🔧 ${timestamp()} [STEP-5] Modal body styled`);
    }
    
    // Show loading screen
    console.log(`🔧 ${timestamp()} [STEP-5] Finding loading and main elements...`);
    const loadingElement = this.modalElement.querySelector('#screenshotLoading');
    const mainElement = this.modalElement.querySelector('#feedbackMain');
    
    console.log(`🔧 ${timestamp()} [STEP-5] Loading element found:`, !!loadingElement);
    console.log(`🔧 ${timestamp()} [STEP-5] Main element found:`, !!mainElement);
    
    if (loadingElement) {
      console.log(`🔧 ${timestamp()} [STEP-5] Styling loading element (show)...`);
      loadingElement.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 !important;
        text-align: center !important;
      `;
      console.log(`🔧 ${timestamp()} [STEP-5] Loading element styled for visibility`);
    }
    if (mainElement) {
      console.log(`🔧 ${timestamp()} [STEP-5] Styling main element (hide)...`);
      mainElement.style.cssText = `
        display: none !important;
        flex: 1 !important;
        flex-direction: row !important;
        overflow: hidden !important;
      `;
      console.log(`🔧 ${timestamp()} [STEP-5] Main element styled for hiding`);
    }

    try {
      console.log(`🔧 ${timestamp()} [STEP-6] ========== COMPONENT INITIALIZATION ==========`);
      
      // Initialize system info
      console.log(`🔧 ${timestamp()} [STEP-6] Gathering system info...`);
      const systemInfoStart = Date.now();
      const systemInfo = await this.components.systemInfo.gather();
      console.log(`🔧 ${timestamp()} [STEP-6] System info gathered (${Date.now() - systemInfoStart}ms)`);
      
      // Initialize chat with system info
      console.log(`🔧 ${timestamp()} [STEP-6] Initializing chat interface...`);
      const chatInitStart = Date.now();
      this.components.chatInterface.initialize(systemInfo);
      console.log(`🔧 ${timestamp()} [STEP-6] Chat interface initialized (${Date.now() - chatInitStart}ms)`);
      
            // Hide loading and show main content
      console.log(`🔧 ${timestamp()} [STEP-7] ========== SWITCHING TO MAIN CONTENT ==========`);
      if (loadingElement) {
        console.log(`🔧 ${timestamp()} [STEP-7] Hiding loading element...`);
        loadingElement.style.display = 'none';
        console.log(`🔧 ${timestamp()} [STEP-7] Loading element hidden`);
      }
      if (mainElement) {
        console.log(`🔧 ${timestamp()} [STEP-7] Showing main content...`);
        const mainShowStart = Date.now();
        mainElement.style.cssText = `
          display: flex !important;
          flex: 1 !important;
          flex-direction: row !important;
          overflow: hidden !important;
        `;
        console.log(`🔧 ${timestamp()} [STEP-7] Main content shown (${Date.now() - mainShowStart}ms)`);
        
        const mainRect = mainElement.getBoundingClientRect();
        console.log(`🔧 ${timestamp()} [STEP-7] Main element rect:`, {
          x: mainRect.x,
          y: mainRect.y,
          width: mainRect.width,
          height: mainRect.height
        });
      }
      
      console.log(`🔧 ${timestamp()} [STEP-7] Modal layout should now be fully visible and stable`);

      // Modal is now working successfully!
      // Screenshot was already centered during canvas setup - no need for second centering!
      console.log(`🎯 ${timestamp()} [STEP-8] ========== SKIPPING SECOND CENTER ==========`);
      console.log(`🎯 ${timestamp()} [STEP-8] Screenshot already centered during canvas setup, no second centering needed`);
      console.log(`🎯 ${timestamp()} [STEP-8] ========== SECOND CENTER SKIPPED ==========`);
      
      // Trigger callback
      console.log(`🎯 ${timestamp()} [STEP-9] ========== FINAL COMPLETION ==========`);
      if (this.options.onOpen) {
        console.log(`🎯 ${timestamp()} [STEP-9] Triggering onOpen callback...`);
        this.options.onOpen();
        console.log(`🎯 ${timestamp()} [STEP-9] onOpen callback completed`);
      }
      
      console.log(`🎯 ${timestamp()} [STEP-9] ========== MODAL SHOW PROCESS COMPLETE ==========`);
    } catch (error) {
      console.error('Error showing visual feedback modal:', error);
      this.hide();
    }
  }

  /**
   * Hide the modal
   */
  hide() {
    if (!this.isVisible) return;

    // Stop any active recording
    if (this.isRecording) {
      this.stopRecording();
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
    this.components.stepReplication?.reset();
    
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
    if (this.isRecording) return;

    try {
      await this.components.stepReplication.startRecording();
      this.isRecording = true;
      
      // Hide modal and show floating stop button
      this.modalElement.style.display = 'none';
      this.floatingStopButton.style.display = 'flex';
      
      // Temporarily restore body styles while recording
      if (this.originalBodyStyles !== null) {
        document.body.setAttribute('style', this.originalBodyStyles);
      } else {
        document.body.removeAttribute('style');
      }
      
      // Add instruction message
      this.components.chatInterface.addMessage('ai', `🎬 **Recording Started!**

The modal has been minimized so you can interact with the page. 

📹 **Screen recording is active**
📝 **All your interactions are being tracked**
🔴 **Look for the red "Stop Recording" button** at the bottom-right

**Go ahead and reproduce the issue** - click, scroll, type, or do whatever causes the problem. When you're done, click the floating "Stop Recording" button to return to this feedback form.`);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to start screen recording. Please ensure you grant permission to capture your screen.');
    }
  }

  /**
   * Stop recording steps
   */
  stopRecording() {
    if (!this.isRecording) return;

    this.components.stepReplication.stopRecording();
    this.isRecording = false;
    
    // Show modal and hide floating stop button
    this.modalElement.style.display = 'flex';
    this.floatingStopButton.style.display = 'none';
    
    // Re-apply overflow hidden to body when modal returns
    const currentBodyStyle = document.body.getAttribute('style') || '';
    document.body.setAttribute('style', currentBodyStyle + '; overflow: hidden !important;');
    
    // Get recording data
    const recordingData = this.components.stepReplication.getRecordingData();
    
    // Show completion message
    const duration = Math.round(recordingData.duration / 1000);
    this.components.chatInterface.addMessage('ai', `✅ **Recording Complete!**

📹 **Screen Recording:** ${duration}s video captured
📝 **Steps Recorded:** ${recordingData.steps.length} interactions tracked
🎯 **Ready for Submission:** Your replication data is now included with the feedback

The recording and step-by-step interactions will be sent along with your feedback to help developers reproduce the issue exactly as you experienced it.`);
  }

  /**
   * Submit feedback
   */
  async handleSubmit() {
    try {
      // Gather all data
      const feedbackData = {
        screenshot: this.components.screenshotCapture.getScreenshotData(),
        annotations: this.components.screenshotCapture.getAnnotations(),
        chatMessages: this.components.chatInterface.getMessages(),
        systemInfo: this.components.systemInfo.getData(),
        replicationData: this.components.stepReplication.getRecordingData(),
        consoleLogs: this.components.consoleLogger?.getLogs() || [],
        submittedAt: new Date().toISOString()
      };

      // Send to API
      if (this.options.apiEndpoint) {
        await this.sendToAPI(feedbackData);
      }

      // Trigger callback
      if (this.options.onSubmit) {
        this.options.onSubmit(feedbackData);
      }

      // Show success message
      this.showSuccessMessage(feedbackData);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.showErrorMessage(error.message);
    }
  }

  /**
   * Send feedback data to API
   */
  async sendToAPI(data) {
    const response = await fetch(this.options.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Show success message
   */
  showSuccessMessage(data) {
    const replicationInfo = data.replicationData ? `
• 🎬 Screen Recording: ${Math.round(data.replicationData.duration / 1000)}s video (${Math.round(data.replicationData.videoBlob?.size / 1024 || 0)}KB)
• 📝 Replication Steps: ${data.replicationData.steps.length} interactions tracked` : '';

    alert(`Feedback submitted successfully! 

📋 Data captured includes:
• 🌐 Browser: ${data.systemInfo.browser} ${data.systemInfo.browserVersion}
• 💻 System: ${data.systemInfo.os} (${data.systemInfo.platform})
• 📱 Display: ${data.systemInfo.viewportWidth}×${data.systemInfo.viewportHeight} @ ${data.systemInfo.devicePixelRatio}x DPI
• 🌍 Network: ${data.systemInfo.ip} (${data.systemInfo.connectionType})
• 📍 Page: ${data.systemInfo.url}
• 🗣️ Language: ${data.systemInfo.language}
• ⏰ Timezone: ${data.systemInfo.timezone}
${data.systemInfo.touchSupported ? '• 👆 Touch device detected\n' : ''}
• 📸 Screenshot: Full resolution (${data.screenshot ? 'captured' : 'N/A'})
• ✏️ Annotations: ${data.annotations.length} drawings
• 💬 Messages: ${data.chatMessages.filter(m => m.type === 'user').length} user messages
• 🖥️ Console Logs: ${data.consoleLogs.length} entries
• 🌐 Network Logs: ${data.systemInfo.networkLogs?.length || 0} requests${replicationInfo}

Thank you for your detailed feedback!`);
    
    this.hide();
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    alert(`Error submitting feedback: ${message}`);
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
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clean up components
    Object.values(this.components).forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);

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