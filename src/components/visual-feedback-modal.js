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
    this.floatingButton.title = 'Report issue with screenshot, logs & system info';
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
   * Show the modal
   */
  async show() {
    console.log('🚀 [SHOW] Modal show() method called!');
    
    if (this.isVisible) {
      console.log('🔍 [SHOW] Modal already visible, returning');
      return;
    }

    console.log('🔍 [SHOW] Starting show() method');
    console.log('🔍 [SHOW] Modal element exists:', !!this.modalElement);
    console.log('🔍 [SHOW] Modal element in DOM:', document.contains(this.modalElement));

    // Take screenshot BEFORE showing modal to prevent layout shift
    console.log('🔧 [SHOW] Taking screenshot before modal display...');
    try {
      await this.components.screenshotCapture.takeScreenshot();
      console.log('🔧 [SHOW] Screenshot captured successfully');
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }

    this.isVisible = true;
    
    // Store original body and html styles before any modifications
    this.originalBodyStyles = document.body.getAttribute('style') || '';
    this.originalHtmlStyles = document.documentElement.getAttribute('style') || '';
    
    // Apply minimal body styles - only prevent scrolling, don't change layout
    const currentBodyStyle = document.body.getAttribute('style') || '';
    document.body.setAttribute('style', currentBodyStyle + '; overflow: hidden !important;');
    
    // Modal container - Clean overlay approach
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
    
    console.log('🔧 [SHOW] Applied clean modal overlay - no body layout changes');
    console.log('🔧 [SHOW] Modal rect:', this.modalElement.getBoundingClientRect());
    console.log('🔧 [SHOW] Modal computed display:', window.getComputedStyle(this.modalElement).display);
    console.log('🔧 [SHOW] Modal computed position:', window.getComputedStyle(this.modalElement).position);
    console.log('🔧 [SHOW] Modal computed zIndex:', window.getComputedStyle(this.modalElement).zIndex);
    console.log('🔧 [SHOW] Modal computed backgroundColor:', window.getComputedStyle(this.modalElement).backgroundColor);
    
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
      
      console.log('🔧 [SHOW] Applied fuller screen modal content styling');
      console.log('🔧 [SHOW] Content container rect:', contentContainer.getBoundingClientRect());
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
      console.log('🔧 [SHOW] Applied modal body styling');
    }
    
    // Show loading screen
    const loadingElement = this.modalElement.querySelector('#screenshotLoading');
    const mainElement = this.modalElement.querySelector('#feedbackMain');
    
    console.log('🔧 [SHOW] Loading element:', !!loadingElement);
    console.log('🔧 [SHOW] Main element:', !!mainElement);
    
    if (loadingElement) {
      loadingElement.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 !important;
        text-align: center !important;
      `;
      console.log('🔧 [SHOW] Loading element visible styles:', loadingElement.style.cssText);
    }
    if (mainElement) {
      mainElement.style.cssText = `
        display: none !important;
        flex: 1 !important;
        flex-direction: row !important;
        overflow: hidden !important;
      `;
      console.log('🔧 [SHOW] Main element hidden styles:', mainElement.style.cssText);
    }

    try {
      console.log('🔧 [SHOW] Screenshot already captured, initializing other components...');
      
      // Initialize system info
      const systemInfo = await this.components.systemInfo.gather();
      console.log('🔧 [SHOW] System info gathered');
      
      // Initialize chat with system info
      this.components.chatInterface.initialize(systemInfo);
      console.log('🔧 [SHOW] Chat interface initialized');
      
      // Hide loading and show main content
      console.log('🔧 [SHOW] Switching from loading to main content...');
      if (loadingElement) {
        loadingElement.style.display = 'none';
        console.log('🔧 [SHOW] Loading hidden');
      }
      if (mainElement) {
        mainElement.style.cssText = `
          display: flex !important;
          flex: 1 !important;
          flex-direction: row !important;
          overflow: hidden !important;
        `;
        console.log('🔧 [SHOW] Main content shown with styles:', mainElement.style.cssText);
      }
      
      console.log('🔧 [SHOW] Modal should now be fully visible');
    
    // Debug CSS visibility issues
    console.log('🔍 [DEBUG] Final modal visibility check:');
    console.log('🔍 [DEBUG] Modal display:', window.getComputedStyle(this.modalElement).display);
    console.log('🔍 [DEBUG] Modal visibility:', window.getComputedStyle(this.modalElement).visibility);
    console.log('🔍 [DEBUG] Modal opacity:', window.getComputedStyle(this.modalElement).opacity);
    console.log('🔍 [DEBUG] Modal z-index:', window.getComputedStyle(this.modalElement).zIndex);
    console.log('🔍 [DEBUG] Modal position:', window.getComputedStyle(this.modalElement).position);
    console.log('🔍 [DEBUG] Modal top:', window.getComputedStyle(this.modalElement).top);
    console.log('🔍 [DEBUG] Modal left:', window.getComputedStyle(this.modalElement).left);
    console.log('🔍 [DEBUG] Modal width:', window.getComputedStyle(this.modalElement).width);
    console.log('🔍 [DEBUG] Modal height:', window.getComputedStyle(this.modalElement).height);
    console.log('🔍 [DEBUG] Modal background:', window.getComputedStyle(this.modalElement).backgroundColor);
    
    // Check if modal is being covered by other elements
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const topElement = document.elementFromPoint(centerX, centerY);
    console.log('🔍 [DEBUG] Element at center of screen:', topElement);
    console.log('🔍 [DEBUG] Is modal at center?:', topElement === this.modalElement || this.modalElement.contains(topElement));
    
    // Modal is now working successfully!
      
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