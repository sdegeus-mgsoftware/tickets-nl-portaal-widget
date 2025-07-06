/**
 * Chat Interface Component
 * Handles the messaging UI and user interactions
 */

export default class ChatInterface {
  constructor(options = {}) {
    this.options = {
      container: null,
      onSendMessage: null,
      onSubmit: null,
      ...options
    };

    this.messages = [];
    this.chatContainer = null;
    this.messageInput = null;
    this.sendButton = null;
    this.submitButton = null;
    this.recordButton = null;
    this.systemInfo = null;

    this.init();
  }

  /**
   * Initialize the chat interface
   */
  init() {
    this.createElements();
    this.setupEventListeners();
    this.addWelcomeMessage();
  }

  /**
   * Create the chat interface elements
   */
  createElements() {
    if (!this.options.container) {
      throw new Error('Container is required for ChatInterface');
    }

    this.options.container.innerHTML = `
      <div class="chat-interface">
        <div class="chat-header">
          <h4>Issue Description</h4>
          <small>Describe what went wrong or what you expected to happen</small>
        </div>
        
        <div class="chat-messages" id="chatMessages">
          <!-- Messages will be added here -->
        </div>
        
        <div class="chat-input-section">
          <div class="chat-input-wrapper">
            <input 
              type="text" 
              id="messageInput" 
              placeholder="Describe the issue you're experiencing..."
              maxlength="500"
            >
            <button id="sendButton" class="send-btn">Send</button>
          </div>
          
          <div class="chat-actions">
            <button id="recordButton" class="action-btn record-btn">
              🎬 Record Steps
            </button>
            
            <button id="submitButton" class="action-btn submit-btn">
              📤 Submit Feedback
            </button>
          </div>
        </div>
        
        <div class="chat-info">
          <div class="info-section" id="systemInfoSection" style="display: none;">
            <h5>📊 System Information</h5>
            <div id="systemInfoContent"></div>
          </div>
          
          <div class="info-section" id="consoleLogsSection" style="display: none;">
            <h5>🖥️ Console Logs</h5>
            <div id="consoleLogsContent"></div>
          </div>
          
          <div class="info-section" id="networkLogsSection" style="display: none;">
            <h5>🌐 Network Requests</h5>
            <div id="networkLogsContent"></div>
          </div>
        </div>
      </div>
    `;

    // Get references to elements
    this.chatContainer = this.options.container.querySelector('#chatMessages');
    this.messageInput = this.options.container.querySelector('#messageInput');
    this.sendButton = this.options.container.querySelector('#sendButton');
    this.submitButton = this.options.container.querySelector('#submitButton');
    this.recordButton = this.options.container.querySelector('#recordButton');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Send message on button click
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Send message on Enter key
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Record button
    this.recordButton.addEventListener('click', () => {
      this.startRecording();
    });

    // Submit button
    this.submitButton.addEventListener('click', () => {
      this.submitFeedback();
    });

    // Auto-resize input
    this.messageInput.addEventListener('input', () => {
      this.updateCharacterCount();
    });
  }

  /**
   * Initialize with system info
   */
  initialize(systemInfo) {
    this.systemInfo = systemInfo;
    this.displaySystemInfo();
  }

  /**
   * Add welcome message
   */
  addWelcomeMessage() {
    this.addMessage('ai', `👋 **Welcome to Visual Feedback!**

I've captured a screenshot of your current page. You can:

🎯 **Annotate the screenshot** - Use the drawing tools to mark specific areas
💬 **Describe the issue** - Tell me what went wrong or what you expected
🎬 **Record your steps** - Show me exactly how to reproduce the problem
📊 **System data** - Browser and system info has been automatically captured

**What issue are you experiencing?**`);
  }

  /**
   * Add a message to the chat
   */
  addMessage(type, content) {
    const timestamp = new Date().toLocaleTimeString();
    const messageId = `msg-${Date.now()}`;
    
    const message = {
      id: messageId,
      type: type, // 'user' or 'ai'
      content: content,
      timestamp: timestamp,
      rawTimestamp: Date.now()
    };

    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
    
    return message;
  }

  /**
   * Render a message in the chat
   */
  renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.type}-message`;
    messageElement.id = message.id;
    
    const avatar = message.type === 'ai' ? '🤖' : '👤';
    const formattedContent = this.formatMessageContent(message.content);
    
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="message-avatar">${avatar}</span>
        <span class="message-time">${message.timestamp}</span>
      </div>
      <div class="message-content">${formattedContent}</div>
    `;
    
    this.chatContainer.appendChild(messageElement);
  }

  /**
   * Format message content with markdown-like formatting
   */
  formatMessageContent(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Send a user message
   */
  sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text) return;

    // Add user message
    this.addMessage('user', text);
    
    // Clear input
    this.messageInput.value = '';
    this.updateCharacterCount();
    
    // Generate AI response
    this.generateAIResponse(text);
    
    // Trigger callback
    if (this.options.onSendMessage) {
      this.options.onSendMessage(text);
    }
  }

  /**
   * Generate AI response based on user input
   */
  generateAIResponse(userMessage) {
    // Simple AI-like responses based on keywords
    let response = '';
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('button') || lowerMessage.includes('click')) {
      response = `🎯 **Button/Click Issue Detected**

I understand you're having trouble with a button or clicking functionality. 

**To help me better understand:**
1. 🖼️ **Mark the problem area** on the screenshot using the drawing tools
2. 🎬 **Record your steps** - Click "Record Steps" to show me exactly what happens
3. 📝 **More details** - What should happen vs. what actually happens?

The screenshot and any annotations will help me identify the exact element you're referring to.`;
    } else if (lowerMessage.includes('error') || lowerMessage.includes('broken')) {
      response = `🚨 **Error/Bug Report**

Thanks for reporting this issue! I've automatically captured:
- 🖥️ **Console logs** - Any JavaScript errors or warnings
- 🌐 **Network requests** - API calls and their responses
- 📊 **System info** - Browser, OS, and technical details

**Next steps:**
1. 🖊️ **Highlight the problem** on the screenshot
2. 📖 **Describe expected behavior** - What should work differently?
3. 🎥 **Record if possible** - Show me the exact steps to reproduce

This will give developers everything they need to fix the issue quickly!`;
    } else if (lowerMessage.includes('slow') || lowerMessage.includes('performance')) {
      response = `⚡ **Performance Issue**

I've captured network timing data and system information to help diagnose performance problems.

**Performance data captured:**
- 🌐 **Network requests** - Loading times and response sizes
- 💻 **Device specs** - CPU, memory, and connection type
- 📊 **Page metrics** - Current performance indicators

**To help optimize:**
1. 🔍 **Identify slow elements** - Mark them on the screenshot
2. ⏱️ **When does it happen** - During page load, specific actions, or always?
3. 📈 **Expected speed** - How fast should it be?`;
    } else if (lowerMessage.includes('design') || lowerMessage.includes('layout') || lowerMessage.includes('ui')) {
      response = `🎨 **Design/Layout Issue**

Visual problems are perfect for screenshot annotation!

**I've captured:**
- 📱 **Viewport size** - ${this.systemInfo?.viewportWidth}×${this.systemInfo?.viewportHeight}
- 🖥️ **Screen resolution** - ${this.systemInfo?.screenWidth}×${this.systemInfo?.screenHeight}
- 📐 **Device pixel ratio** - ${this.systemInfo?.devicePixelRatio}x

**Please:**
1. 🖊️ **Draw on the screenshot** - Circle, highlight, or arrow to problem areas
2. 📝 **Describe the issue** - What looks wrong or different from expected?
3. 📱 **Device context** - Does this happen on all screen sizes?

The visual annotation will make it crystal clear what needs to be fixed!`;
    } else {
      response = `✅ **Got it!**

Thanks for the feedback! I've automatically captured comprehensive information about your session.

**Data collected:**
- 📸 **Screenshot** - Current page state with annotation capabilities
- 🔧 **Technical details** - Browser, OS, device specifications
- 📊 **Runtime data** - Console logs, network requests, system metrics

**What's next?**
1. 🎯 **Annotate the screenshot** - Mark specific problem areas
2. 🎬 **Record steps** - Show exactly how to reproduce any issues
3. 📤 **Submit when ready** - All data will be packaged together

**Need to add anything else?** Feel free to provide more details!`;
    }
    
    // Add AI response with a slight delay for realism
    setTimeout(() => {
      this.addMessage('ai', response);
    }, 800);
  }

  /**
   * Start recording steps
   */
  startRecording() {
    // This will be handled by the parent modal
    this.addMessage('ai', '🎬 **Starting Step Recording...**\n\nPlease grant screen recording permission when prompted.');
  }

  /**
   * Submit feedback
   */
  submitFeedback() {
    if (this.messages.filter(m => m.type === 'user').length === 0) {
      alert('Please describe the issue before submitting feedback.');
      return;
    }

    if (this.options.onSubmit) {
      this.options.onSubmit();
    }
  }

  /**
   * Display system information
   */
  displaySystemInfo() {
    if (!this.systemInfo) return;

    const section = this.options.container.querySelector('#systemInfoSection');
    const content = this.options.container.querySelector('#systemInfoContent');
    
    content.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <strong>🌐 Browser:</strong> ${this.systemInfo.browser} ${this.systemInfo.browserVersion}
        </div>
        <div class="info-item">
          <strong>💻 OS:</strong> ${this.systemInfo.os} (${this.systemInfo.platform})
        </div>
        <div class="info-item">
          <strong>📱 Display:</strong> ${this.systemInfo.viewportWidth}×${this.systemInfo.viewportHeight} @ ${this.systemInfo.devicePixelRatio}x
        </div>
        <div class="info-item">
          <strong>🌍 Location:</strong> ${this.systemInfo.ip} (${this.systemInfo.timezone})
        </div>
        <div class="info-item">
          <strong>🗣️ Language:</strong> ${this.systemInfo.language}
        </div>
        <div class="info-item">
          <strong>🔗 Connection:</strong> ${this.systemInfo.connectionType}
        </div>
      </div>
    `;
    
    section.style.display = 'block';
  }

  /**
   * Display console logs
   */
  displayConsoleLogs(logs) {
    if (!logs || logs.length === 0) return;

    const section = this.options.container.querySelector('#consoleLogsSection');
    const content = this.options.container.querySelector('#consoleLogsContent');
    
    const logHtml = logs.map(log => `
      <div class="log-entry ${log.level}">
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level">${log.level}</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
      </div>
    `).join('');
    
    content.innerHTML = `
      <div class="logs-container">
        ${logHtml}
      </div>
    `;
    
    section.style.display = 'block';
  }

  /**
   * Display network logs
   */
  displayNetworkLogs(logs) {
    if (!logs || logs.length === 0) return;

    const section = this.options.container.querySelector('#networkLogsSection');
    const content = this.options.container.querySelector('#networkLogsContent');
    
    const logHtml = logs.map(log => `
      <div class="network-entry ${log.status >= 400 ? 'error' : 'success'}">
        <div class="network-header">
          <span class="network-method">${log.method}</span>
          <span class="network-url">${log.url}</span>
          <span class="network-status">${log.status}</span>
        </div>
        <div class="network-details">
          <small>Duration: ${log.duration}ms | Size: ${log.size} bytes</small>
        </div>
      </div>
    `).join('');
    
    content.innerHTML = `
      <div class="network-container">
        ${logHtml}
      </div>
    `;
    
    section.style.display = 'block';
  }

  /**
   * Update character count
   */
  updateCharacterCount() {
    const length = this.messageInput.value.length;
    const maxLength = parseInt(this.messageInput.getAttribute('maxlength'));
    
    if (length > maxLength * 0.8) {
      this.messageInput.style.borderColor = length >= maxLength ? '#ef4444' : '#f59e0b';
    } else {
      this.messageInput.style.borderColor = '';
    }
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get all messages
   */
  getMessages() {
    return [...this.messages];
  }

  /**
   * Reset the chat interface
   */
  reset() {
    this.messages = [];
    this.chatContainer.innerHTML = '';
    this.messageInput.value = '';
    this.addWelcomeMessage();
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    this.sendButton?.removeEventListener('click', this.sendMessage);
    this.messageInput?.removeEventListener('keypress', this.handleKeyPress);
    this.recordButton?.removeEventListener('click', this.startRecording);
    this.submitButton?.removeEventListener('click', this.submitFeedback);
    
    // Clear references
    this.messages = [];
    this.chatContainer = null;
    this.messageInput = null;
    this.sendButton = null;
    this.submitButton = null;
    this.recordButton = null;
  }
} 