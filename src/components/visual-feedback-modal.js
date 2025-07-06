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
    if (this.isVisible) return;

    console.log('🔍 [DEBUG] Modal show() called');
    console.log('🔍 [DEBUG] Modal element:', this.modalElement);
    console.log('🔍 [DEBUG] Modal element in DOM:', document.contains(this.modalElement));

    this.isVisible = true;
    this.modalElement.style.display = 'flex';
    
    console.log('🔍 [DEBUG] Modal display set to flex');
    console.log('🔍 [DEBUG] Modal computed styles:', window.getComputedStyle(this.modalElement));
    console.log('🔍 [DEBUG] Modal position:', this.modalElement.getBoundingClientRect());
    
    // Show loading
    this.modalElement.querySelector('#screenshotLoading').style.display = 'block';
    this.modalElement.querySelector('#feedbackMain').style.display = 'none';

    console.log('🔍 [DEBUG] Loading screen display:', this.modalElement.querySelector('#screenshotLoading').style.display);
    console.log('🔍 [DEBUG] Loading screen element:', this.modalElement.querySelector('#screenshotLoading'));
    console.log('🔍 [DEBUG] Main content display:', this.modalElement.querySelector('#feedbackMain').style.display);

    try {
      console.log('🔍 [DEBUG] Starting screenshot capture...');
      // Take screenshot
      await this.components.screenshotCapture.takeScreenshot();
      console.log('🔍 [DEBUG] Screenshot capture complete');
      
      // Initialize system info
      const systemInfo = await this.components.systemInfo.gather();
      console.log('🔍 [DEBUG] System info gathered');
      
      // Initialize chat with system info
      this.components.chatInterface.initialize(systemInfo);
      console.log('🔍 [DEBUG] Chat interface initialized');
      
      // Hide loading and show main content
      this.modalElement.querySelector('#screenshotLoading').style.display = 'none';
      this.modalElement.querySelector('#feedbackMain').style.display = 'flex';
      
      console.log('🔍 [DEBUG] Content switched - Loading hidden, Main shown');
      console.log('🔍 [DEBUG] Loading screen final display:', this.modalElement.querySelector('#screenshotLoading').style.display);
      console.log('🔍 [DEBUG] Main content final display:', this.modalElement.querySelector('#feedbackMain').style.display);
      
      console.log('🔍 [DEBUG] Modal should now be visible');
      console.log('🔍 [DEBUG] Final modal position:', this.modalElement.getBoundingClientRect());
      
      // VISUAL TEST: Force modal to be visible with bright background
      console.log('🔍 [DEBUG] VISUAL TEST: Forcing modal to be visible with red background');
      this.modalElement.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
      this.modalElement.style.zIndex = '9999999';
      this.modalElement.style.position = 'fixed';
      this.modalElement.style.top = '0';
      this.modalElement.style.left = '0';
      this.modalElement.style.width = '100vw';
      this.modalElement.style.height = '100vh';
      this.modalElement.style.display = 'flex';
      console.log('🔍 [DEBUG] Visual test applied - you should see a RED overlay covering the entire screen');
      
      // COMPREHENSIVE CSS DEBUG
      const computedStyles = window.getComputedStyle(this.modalElement);
      console.log('🔍 [DEBUG] ACTUAL COMPUTED STYLES:');
      console.log('🔍 [DEBUG] Position:', computedStyles.position);
      console.log('🔍 [DEBUG] Display:', computedStyles.display);
      console.log('🔍 [DEBUG] Z-index:', computedStyles.zIndex);
      console.log('🔍 [DEBUG] Background-color:', computedStyles.backgroundColor);
      console.log('🔍 [DEBUG] Width:', computedStyles.width);
      console.log('🔍 [DEBUG] Height:', computedStyles.height);
      console.log('🔍 [DEBUG] Top:', computedStyles.top);
      console.log('🔍 [DEBUG] Left:', computedStyles.left);
      console.log('🔍 [DEBUG] Visibility:', computedStyles.visibility);
      console.log('🔍 [DEBUG] Opacity:', computedStyles.opacity);
      console.log('🔍 [DEBUG] Transform:', computedStyles.transform);
      console.log('🔍 [DEBUG] Clip:', computedStyles.clip);
      console.log('🔍 [DEBUG] Clip-path:', computedStyles.clipPath);
      
      // CHECK CSS LOADING
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
      console.log('🔍 [DEBUG] CSS files loaded:', cssLinks.length);
      cssLinks.forEach((link, i) => {
        console.log(`🔍 [DEBUG] CSS ${i+1}:`, link.href, link.sheet ? 'LOADED' : 'NOT LOADED');
      });
      
      // ALTERNATIVE VISIBILITY METHODS
      console.log('🔍 [DEBUG] Trying alternative visibility methods...');
      
      // Method 1: Force inline styles with !important via CSS text
      this.modalElement.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(255, 0, 0, 0.9) !important;
        z-index: 9999999 !important;
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      `;
      
      // Method 2: Remove all CSS classes and force basic visibility
      const originalClasses = this.modalElement.className;
      this.modalElement.className = '';
      console.log('🔍 [DEBUG] Removed CSS classes, original:', originalClasses);
      
      // Method 3: Check parent elements
      let parent = this.modalElement.parentElement;
      while (parent) {
        const parentStyles = window.getComputedStyle(parent);
        console.log('🔍 [DEBUG] Parent element:', parent.tagName, {
          position: parentStyles.position,
          overflow: parentStyles.overflow,
          zIndex: parentStyles.zIndex,
          transform: parentStyles.transform
        });
        parent = parent.parentElement;
        if (parent === document.documentElement) break;
      }
      
      console.log('🔍 [DEBUG] If you STILL cannot see a red overlay, there is a fundamental CSS or browser issue');
      
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