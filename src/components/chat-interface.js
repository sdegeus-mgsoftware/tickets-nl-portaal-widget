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
    this.systemInfo = null;

    this.init();
  }

  /**
   * Initialize the chat interface
   */
  init() {
    this.createElements();
    this.setupEventListeners();
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
          

        </div>
      </div>
    `;

    // Get references to elements
    this.chatContainer = this.options.container.querySelector('#chatMessages');
    this.messageInput = this.options.container.querySelector('#messageInput');
    this.sendButton = this.options.container.querySelector('#sendButton');
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
    // System info is now displayed in dedicated System Info tab
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
    

    
    // Trigger callback
    if (this.options.onSendMessage) {
      this.options.onSendMessage(text);
    }
  }





  // System info, console logs, and network logs are now displayed in dedicated tabs
  // These display methods have been removed from the chat interface

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

  }

  /**
   * Destroy the component
   */
  destroy() {
    // Remove event listeners
    this.sendButton?.removeEventListener('click', this.sendMessage);
    this.messageInput?.removeEventListener('keypress', this.handleKeyPress);

    
    // Clear references
    this.messages = [];
    this.chatContainer = null;
    this.messageInput = null;
    this.sendButton = null;
  }
} 