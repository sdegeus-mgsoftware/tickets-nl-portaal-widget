/**
 * Data Collector
 * Handles gathering and formatting of all feedback data
 */

export default class DataCollector {
  constructor(components, modalElement) {
    this.components = components;
    this.modalElement = modalElement;
  }

  /**
   * Collect all feedback data
   */
  collectFeedbackData() {
    const feedbackData = {
      screenshot: this.components.screenshotCapture.getScreenshotData(),
      annotations: this.components.screenshotCapture.getAnnotations(),
      chatMessages: this.components.chatInterface.getMessages(),
      systemInfo: this.components.systemInfo.getData(),
      replicationData: this.components.stepReplication?.getRecordingData() || null,
      consoleLogs: this.components.consoleLogger?.getLogs() || [],
      submittedAt: new Date().toISOString()
    };

    return feedbackData;
  }

  /**
   * Build detailed ticket description from feedback data
   */
  buildTicketDescription(feedbackData, userMessages) {
    let description = '## User Feedback\n\n';
    
    // Add user messages
    if (userMessages.length > 0) {
      description += '### User Messages:\n';
      userMessages.forEach((msg, index) => {
        description += `${index + 1}. ${msg.content}\n`;
      });
      description += '\n';
    }
    
    // Add visual feedback info
    description += '### Visual Feedback Data:\n';
    description += `- **Screenshot**: ${feedbackData.screenshot ? '✅ Captured' : '❌ Not captured'}\n`;
    description += `- **Annotations**: ${feedbackData.annotations.length} drawings\n`;
    description += `- **Console Logs**: ${feedbackData.consoleLogs.length} entries (raw JSON included in metadata)\n`;
    
    // Add page context
    description += `\n### Page Context:\n`;
    description += `- **URL**: ${feedbackData.systemInfo.url}\n`;
    description += `- **User Agent**: ${feedbackData.systemInfo.userAgent}\n`;
    description += `- **Viewport**: ${feedbackData.systemInfo.viewportWidth}×${feedbackData.systemInfo.viewportHeight}\n`;
    
    // Add network info
    description += `\n### Network Info:\n`;
    description += `- **IP Address**: ${feedbackData.systemInfo.ip || 'Not available'}\n`;
    description += `- **Connection Type**: ${feedbackData.systemInfo.connectionType || 'Unknown'}\n`;
    description += `- **Network Logs**: ${feedbackData.systemInfo.networkLogs?.length || 0} requests\n`;
    
    description += `\n### Submission Details:\n`;
    description += `- **Submitted**: ${feedbackData.submittedAt}\n`;
    description += `- **Widget Version**: 1.2.0\n`;
    description += `- **Modal Data**: ✅ Included (screenshots, chat, raw console logs, system info, network info)\n`;
    
    return description;
  }

  /**
   * Determine ticket priority based on feedback content
   */
  determinePriority(feedbackData) {
    // High priority if there are console errors
    if (feedbackData.consoleLogs.some(log => log.level === 'error')) {
      return 'high';
    }
    
    // Medium priority if there are warnings or multiple annotations
    if (feedbackData.consoleLogs.some(log => log.level === 'warn') || 
        feedbackData.annotations.length > 3) {
      return 'medium';
    }
    
    // Check user message content for urgency keywords
    const userMessages = feedbackData.chatMessages.filter(m => m.type === 'user');
    const allText = userMessages.map(m => m.content.toLowerCase()).join(' ');
    
    if (allText.includes('urgent') || allText.includes('critical') || 
        allText.includes('broken') || allText.includes('error')) {
      return 'high';
    }
    
    if (allText.includes('bug') || allText.includes('issue') || 
        allText.includes('problem')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Format ticket data for submission
   */
  formatTicketData(feedbackData, title, description, userId) {
    const userMessages = feedbackData.chatMessages.filter(m => m.type === 'user');

    return {
      title,
      description,
      category: 'task',
      priority: this.determinePriority(feedbackData),
      requester_id: userId,
      metadata: {
        // Widget-specific feedback data only
        feedback_context: {
          widget_version: '1.2.0',
          submission_method: 'visual_feedback_modal',
          submitted_at: feedbackData.submittedAt,
          
          // User interaction data
          user_messages: userMessages,
          
          // Visual feedback data
          screenshot_captured: !!feedbackData.screenshot,
          annotations_count: feedbackData.annotations.length,
          
          // Console logs (raw data in JSON)
          console_logs: feedbackData.consoleLogs,
          
          // System info from modal (includes network info)
          system_info: feedbackData.systemInfo
        }
      }
    };
  }

  /**
   * Extract title from user messages
   */
  extractTitle(chatMessages) {
    const userMessages = chatMessages.filter(m => m.type === 'user');
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content;
      return firstMessage.substring(0, 100) + (firstMessage.length > 100 ? '...' : '');
    }
    return 'Feedback from Visual Widget';
  }

  /**
   * Collect comprehensive feedback data for debugging/logging
   */
  collectComprehensiveFeedbackData() {
    try {
      // Get screenshot data URL from canvas
      const screenshot = this.getScreenshotData();
      
      // Get system info
      const systemInfo = this.components.systemInfo?.getData() || {};
      
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
          curlCommand: log.curlCommand || null,
          requestHeaders: log.requestHeaders || null,
          requestPayload: log.requestPayload || null,
          responseData: log.responseData || null,
          headers: log.headers || null
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
      
      return feedbackData;
      
    } catch (error) {
      console.error('❌ Error collecting comprehensive feedback data:', error);
      return null;
    }
  }

  /**
   * Get screenshot data from canvas
   */
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

  /**
   * Get chat messages
   */
  getChatMessages() {
    try {
      if (this.components.chatInterface && this.components.chatInterface.getMessages) {
        return this.components.chatInterface.getMessages();
      }
      
      // Fallback: extract messages from DOM  
      const messages = [];
      const chatTab = this.modalElement.querySelector('#chatTab');
      const messageElements = chatTab ? chatTab.querySelectorAll('.message') : [];
      
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

  /**
   * Generate unique submission ID
   */
  generateSubmissionId() {
    return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}