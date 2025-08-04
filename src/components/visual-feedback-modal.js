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
    const screenshotPanel = this.modalElement.querySelector('#screenshotPanel');
    const chatTab = this.modalElement.querySelector('#chatTab');
    const systemTab = this.modalElement.querySelector('#systemTab');
    const consoleTab = this.modalElement.querySelector('#consoleTab');
    const networkTab = this.modalElement.querySelector('#networkTab');

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

    // Initialize system info display in the system tab
    this.components.systemInfo = new SystemInfo({
      enableConsoleLogging: this.options.enableConsoleLogging,
      enableNetworkLogging: this.options.enableNetworkLogging
    });

    // Initialize console logger if enabled
    if (this.options.enableConsoleLogging) {
      this.components.consoleLogger = new ConsoleLogger({
        container: consoleTab,
        onLogsCaptured: this.handleLogsCaptured.bind(this)
      });
    }

    // Store network tab reference for network log rendering
    this.networkTab = networkTab;

    // Setup global submit button
    this.setupGlobalSubmitButton();

    // Setup tab switching functionality
    this.setupTabSwitching();
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
   * Setup global submit button
   */
  setupGlobalSubmitButton() {
    const globalSubmitButton = this.modalElement.querySelector('#globalSubmitButton');
    if (globalSubmitButton) {
      globalSubmitButton.addEventListener('click', () => {
        this.collectAndLogFeedbackData();
      });
    }
  }

  /**
   * Setup tab switching functionality
   */
  setupTabSwitching() {
    const tabButtons = this.modalElement.querySelectorAll('.tab-btn');
    const tabPanels = this.modalElement.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        const targetPanel = this.modalElement.querySelector(`#${targetTab}Tab`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Handle tab-specific initialization when switching
        this.handleTabSwitch(targetTab);
      });
    });
  }

  /**
   * Handle tab switch events
   */
  handleTabSwitch(tabName) {
    switch (tabName) {
      case 'system':
        this.displaySystemInfo();
        break;
      case 'console':
        this.displayConsoleLogs();
        break;
      case 'network':
        this.displayNetworkLogs();
        break;
      case 'steps':
        this.displayStepRecording();
        break;
      // Chat tab is handled by ChatInterface component
    }
  }

  /**
   * Display system information in the system tab
   */
  displaySystemInfo() {
    const systemTab = this.modalElement.querySelector('#systemTab');
    if (!systemTab || !this.components.systemInfo) return;

    // Use the cached system info that was gathered during modal initialization
    const systemInfo = this.cachedSystemInfo || this.components.systemInfo.getData();
    if (!systemInfo) {
      systemTab.innerHTML = `
        <div class="system-info-content">
          <h4>💻 System Information</h4>
          <p>System information is still being gathered...</p>
        </div>
      `;
      return;
    }

    systemTab.innerHTML = `
      <div class="system-info-content">
        <h4>💻 System Information</h4>
        <div class="info-grid">
          <div class="info-item">
            <strong>🌐 Browser:</strong> ${systemInfo.browser || 'N/A'} ${systemInfo.browserVersion || ''}
          </div>
          <div class="info-item">
            <strong>💻 OS:</strong> ${systemInfo.os || 'N/A'} (${systemInfo.platform || 'N/A'})
          </div>
          <div class="info-item">
            <strong>📱 Display:</strong> ${systemInfo.viewportWidth || 'N/A'}×${systemInfo.viewportHeight || 'N/A'} @ ${systemInfo.devicePixelRatio || 'N/A'}x
          </div>
          <div class="info-item">
            <strong>🌍 Location:</strong> ${systemInfo.ip || 'N/A'} (${systemInfo.timezone || 'N/A'})
          </div>
          <div class="info-item">
            <strong>🗣️ Language:</strong> ${systemInfo.language || 'N/A'}
          </div>
          <div class="info-item">
            <strong>🔗 Connection:</strong> ${systemInfo.connectionType || 'N/A'}
          </div>
          <div class="info-item">
            <strong>📍 Page URL:</strong> ${systemInfo.url || 'N/A'}
          </div>
          <div class="info-item">
            <strong>⏰ Timestamp:</strong> ${systemInfo.timestamp ? new Date(systemInfo.timestamp).toLocaleString() : 'N/A'}
          </div>
          ${systemInfo.touchSupported ? `
          <div class="info-item">
            <strong>👆 Touch:</strong> Touch device detected
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Display console logs in the console tab
   */
  displayConsoleLogs() {
    const consoleTab = this.modalElement.querySelector('#consoleTab');
    if (!consoleTab) return;

    if (this.components.consoleLogger) {
      const consoleLogs = this.components.consoleLogger.getLogs();
      
      if (consoleLogs.length === 0) {
        consoleTab.innerHTML = `
          <div class="console-info">
            <h4>🖥️ Console Logs</h4>
            <div class="console-logs-container">
              <div class="console-empty-state">
                <span class="empty-message">Console was cleared or no messages have been logged yet.</span>
              </div>
            </div>
            <div class="log-actions">
              <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearConsoleLogs(); this.closest('.visual-feedback-modal').displayConsoleLogs();">🗑️ Clear Logs</button>
            </div>
          </div>
        `;
        return;
      }

      // Generate console logs HTML with browser-like styling
      const consoleLogsHtml = consoleLogs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        
        return `
          <div class="console-log-entry ${log.level}">

            <span class="log-message">${log.message}</span>
            ${log.stack ? `<div class="log-stack"><pre>${log.stack}</pre></div>` : ''}
          </div>
        `;
      }).join('');

      consoleTab.innerHTML = `
        <div class="console-info">
          <h4>🖥️ Console Logs (${consoleLogs.length})</h4>
          <div class="console-logs-container">
            ${consoleLogsHtml}
          </div>
          <div class="log-actions">
            <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearConsoleLogs(); this.closest('.visual-feedback-modal').displayConsoleLogs();">🗑️ Clear Logs</button>
          </div>
        </div>
      `;
    } else {
      consoleTab.innerHTML = `
        <div class="console-info">
          <h4>🖥️ Console Logs</h4>
          <p>Console logging is not enabled. Enable it in the widget configuration to see console logs here.</p>
        </div>
      `;
    }
  }

  /**
   * Display network logs in the network tab
   */
  displayNetworkLogs() {
    const networkTab = this.modalElement.querySelector('#networkTab');
    if (!networkTab) return;

    if (this.components.consoleLogger) {
      const networkLogs = this.components.consoleLogger.getNetworkLogs();
      
      if (networkLogs.length === 0) {
        networkTab.innerHTML = `
          <div class="network-info">
            <h4>🌐 Network Logs</h4>
            <p>No network requests captured yet. Network requests will appear here as they happen.</p>
            <small>Tip: Refresh the page or interact with the application to see network activity.</small>
          </div>
        `;
        return;
      }

      // Generate network logs HTML
      const networkLogsHtml = networkLogs.map(log => {
        const statusClass = log.status >= 400 ? 'error' : log.status >= 300 ? 'warning' : 'success';
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        
        return `
          <div class="network-log-entry ${statusClass}">
            <div class="log-header">
              <span class="method ${log.method}">${log.method}</span>
              <span class="status status-${statusClass}">${log.status}</span>
              <span class="url">${log.url}</span>

            </div>
            <div class="log-details">
              <div class="detail-item">
                <strong>Duration:</strong> ${log.duration}ms
              </div>
              <div class="detail-item">
                <strong>Size:</strong> ${log.size} bytes
              </div>
              <div class="detail-item">
                <strong>Type:</strong> ${log.type}
              </div>
              ${log.error ? `<div class="detail-item error"><strong>Error:</strong> ${log.error}</div>` : ''}
            </div>
            ${log.curlCommand ? `
              <div class="curl-command">
                <button class="copy-btn" onclick="navigator.clipboard.writeText('${log.curlCommand}')">📋 Copy cURL</button>
                <code>${log.curlCommand}</code>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      networkTab.innerHTML = `
        <div class="network-info">
          <h4>🌐 Network Logs (${networkLogs.length})</h4>
          <div class="network-logs-container">
            ${networkLogsHtml}
          </div>
          <div class="log-actions">
            <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearNetworkLogs(); this.closest('.visual-feedback-modal').displayNetworkLogs();">🗑️ Clear Logs</button>
          </div>
        </div>
      `;
    } else {
      networkTab.innerHTML = `
        <div class="network-info">
          <h4>🌐 Network Logs</h4>
          <p>Network logging is not enabled. Enable console/network logging in the widget configuration to see network requests here.</p>
        </div>
      `;
    }
  }

  /**
   * Display step recording interface in the steps tab
   */
  displayStepRecording() {
    const stepsTab = this.modalElement.querySelector('#stepsTab');
    if (!stepsTab || !this.components.stepReplication) return;

    // StepReplication component will render its own content when initialized
    // We just need to ensure it has the right container
    this.components.stepReplication.setContainer(stepsTab);
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
    if (this.isVisible) {
      return;
    }

    // Show temporary loading indicator on page BEFORE taking screenshot
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

      const contentRect = contentContainer.getBoundingClientRect();
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
    
    // Show loading screen

    const loadingElement = this.modalElement.querySelector('#screenshotLoading');
    const mainElement = this.modalElement.querySelector('#feedbackMain');

    if (loadingElement) {

      loadingElement.style.cssText = `
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 !important;
        text-align: center !important;
      `;

    }
    if (mainElement) {

      mainElement.style.cssText = `
        display: none !important;
        flex: 1 !important;
        flex-direction: row !important;
        overflow: hidden !important;
      `;

    }

    try {

      // Initialize system info

      const systemInfoStart = Date.now();
      const systemInfo = await this.components.systemInfo.gather();

      // Cache system info for use in tabs
      this.cachedSystemInfo = systemInfo;
      
      // Initialize chat with system info

      const chatInitStart = Date.now();
      this.components.chatInterface.initialize(systemInfo);

            // Hide loading and show main content

      if (loadingElement) {

        loadingElement.style.display = 'none';

      }
      if (mainElement) {

        const mainShowStart = Date.now();
        mainElement.style.cssText = `
          display: flex !important;
          flex: 1 !important;
          flex-direction: row !important;
          overflow: hidden !important;
        `;

        const mainRect = mainElement.getBoundingClientRect();
      }

      // NOW the modal layout is complete - time to scale and center the canvas!

      // Give the layout a moment to stabilize, then center the canvas
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (this.components.screenshotCapture) {
        this.components.screenshotCapture.centerCanvasWhenReady();

      } else {

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
   * Collect and log comprehensive feedback data for API submission
   */
  collectAndLogFeedbackData() {
    try {
      // Get screenshot data URL from canvas
      const screenshot = this.getScreenshotData();
      
      // Get system info
      const systemInfo = this.cachedSystemInfo || {};
      
      // Get console logs
      const consoleLogs = this.components.consoleLogger ? this.components.consoleLogger.getLogs() : [];
      
      // Get network logs  
      const networkLogs = this.components.consoleLogger ? this.components.consoleLogger.getNetworkLogs() : [];
      
      // Get chat messages
      const chatMessages = this.getChatMessages();
      
      // Build comprehensive feedback JSON
      const feedbackData = {
        timestamp: new Date().toISOString(),
        screenshot: {
          dataUrl: screenshot,
          timestamp: new Date().toISOString()
        },
        systemInfo: {
          browser: systemInfo.browser || 'Unknown',
          browserVersion: systemInfo.browserVersion || 'Unknown',
          os: systemInfo.os || 'Unknown',
          osVersion: systemInfo.osVersion || 'Unknown',
          screenResolution: systemInfo.screenResolution || 'Unknown',
          viewport: systemInfo.viewport || 'Unknown',
          userAgent: systemInfo.userAgent || navigator.userAgent,
          language: systemInfo.language || 'Unknown',
          timezone: systemInfo.timezone || 'Unknown',
          cookiesEnabled: systemInfo.cookiesEnabled || false,
          onlineStatus: systemInfo.onlineStatus || false,
          referrer: systemInfo.referrer || '',
          url: systemInfo.url || window.location.href
        },
        consoleLogs: consoleLogs.map(log => ({
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          stack: log.stack || null
        })),
        networkLogs: networkLogs.map(log => ({
          method: log.method,
          url: log.url,
          status: log.status,
          statusText: log.statusText,
          timestamp: log.timestamp,
          duration: log.duration,
          size: log.size,
          type: log.type,
          error: log.error || null,
          curlCommand: log.curlCommand || null
        })),
        chat: {
          messages: chatMessages,
          messageCount: chatMessages.length
        },
        metadata: {
          feedbackVersion: '1.0.0',
          widgetVersion: '1.0.0',
          submissionId: this.generateSubmissionId()
        }
      };

      // Console log the complete feedback data
      console.log('🚀 FEEDBACK DATA READY FOR API SUBMISSION:');
      console.log(JSON.stringify(feedbackData, null, 2));
      
      // Also log a summary
      console.log('📊 FEEDBACK SUMMARY:');
      console.log(`- Screenshot: ${screenshot ? 'Captured' : 'Missing'}`);
      console.log(`- System Info: ${Object.keys(systemInfo).length} properties`);
      console.log(`- Console Logs: ${consoleLogs.length} entries`);  
      console.log(`- Network Logs: ${networkLogs.length} requests`);
      console.log(`- Chat Messages: ${chatMessages.length} messages`);
      
      return feedbackData;
      
    } catch (error) {
      console.error('❌ Error collecting feedback data:', error);
      return null;
    }
  }

  getScreenshotData() {
    try {
      const canvas = this.modalElement.querySelector('#screenshotCanvas');
      if (canvas) {
        return canvas.toDataURL('image/png');
      }
      return null;
    } catch (error) {
      console.error('Error getting screenshot data:', error);
      return null;
    }
  }

  getChatMessages() {
    try {
      if (this.components.chatInterface && this.components.chatInterface.getMessages) {
        return this.components.chatInterface.getMessages();
      }
      
      // Fallback: extract messages from DOM  
      const messages = [];
      const messageElements = this.chatTab ? this.chatTab.querySelectorAll('.message') : [];
      messageElements.forEach(element => {
        const isUser = element.classList.contains('user');
        const messageText = element.querySelector('.message-content')?.textContent || element.textContent;
        messages.push({
          type: isUser ? 'user' : 'ai',
          content: messageText.trim(),
          timestamp: new Date().toISOString()
        });
      });
      
      return messages;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  generateSubmissionId() {
    return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
