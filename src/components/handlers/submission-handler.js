/**
 * Submission Handler
 * Handles ticket creation and feedback submission
 */

import { ApiClient } from '../../core/api-client.js';

export default class SubmissionHandler {
  constructor(options = {}) {
    this.options = options;
    this.apiClient = new ApiClient({
      apiUrl: options.apiUrl,
      organizationId: options.organizationId,
      projectId: options.projectId
    });
  }

  /**
   * Submit feedback as a ticket
   */
  async submitTicket(ticketData) {
    try {
      console.log('🎯 Creating ticket...');
      
      const result = await this.apiClient.createTicket(ticketData);
      
              if (result.success) {
          console.log('✅ Ticket created successfully:', result.data?.ticket?.ticket_number || result.ticket?.ticket_number);
          // Handle both response formats: { data: { ticket } } and { ticket }
          const ticket = result.data?.ticket || result.ticket;
          return { success: true, ticket: ticket };
        } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit feedback to legacy API endpoint
   */
  async submitLegacyFeedback(feedbackData) {
    try {
      console.log('📤 Using legacy feedback submission...');
      
      if (!this.options.apiEndpoint) {
        throw new Error('No API endpoint configured for legacy feedback submission');
      }

      const response = await fetch(this.options.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Error submitting legacy feedback:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show ticket success message
   */
  showTicketSuccessMessage(ticket, feedbackData, onComplete) {
    alert(`🎉 Ticket Created Successfully!

🎫 **Ticket #${ticket.ticket_number}** (ID: ${ticket.id})
📋 Priority: ${ticket.priority.toUpperCase()}
🏷️  Category: ${ticket.category}

📋 **FEEDBACK DATA COLLECTED:**
• 📸 Screenshot: ${feedbackData.screenshot ? '✅ Captured' : '❌ Not captured'}
• ✏️ Annotations: ${feedbackData.annotations.length} drawings
• 💬 Chat Messages: ✅ Included
• 🖥️ Console Logs: ${feedbackData.consoleLogs.length} entries (raw JSON included)

📊 **SYSTEM INFO:**
• 🌐 Browser: ${feedbackData.systemInfo.browser} ${feedbackData.systemInfo.browserVersion}
• 💻 System: ${feedbackData.systemInfo.os} (${feedbackData.systemInfo.platform})
• 📱 Display: ${feedbackData.systemInfo.viewportWidth}×${feedbackData.systemInfo.viewportHeight} @ ${feedbackData.systemInfo.devicePixelRatio}x DPI
• 📍 Page: ${feedbackData.systemInfo.url}
• 🗣️ Language: ${feedbackData.systemInfo.language}
• ⏰ Timezone: ${feedbackData.systemInfo.timezone}
${feedbackData.systemInfo.touchSupported ? '• 👆 Touch device detected\n' : ''}

📡 **NETWORK INFO:**
• 🌍 IP Address: ${feedbackData.systemInfo.ip || 'Not available'}
• 📶 Connection: ${feedbackData.systemInfo.connectionType || 'Unknown'}
• 🌐 Network Logs: ${feedbackData.systemInfo.networkLogs?.length || 0} requests

Thank you for your feedback! Your ticket contains all the necessary information to help resolve your issue. 🙏`);
    
    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Show legacy feedback success message
   */
  showLegacySuccessMessage(feedbackData, onComplete) {
    const replicationInfo = feedbackData.replicationData ? `
• 🎬 Screen Recording: ${Math.round(feedbackData.replicationData.duration / 1000)}s video (${Math.round(feedbackData.replicationData.videoBlob?.size / 1024 || 0)}KB)
• 📝 Replication Steps: ${feedbackData.replicationData.steps.length} interactions tracked` : '';

    alert(`Feedback submitted successfully! 

📋 Data captured includes:
• 🌐 Browser: ${feedbackData.systemInfo.browser} ${feedbackData.systemInfo.browserVersion}
• 💻 System: ${feedbackData.systemInfo.os} (${feedbackData.systemInfo.platform})
• 📱 Display: ${feedbackData.systemInfo.viewportWidth}×${feedbackData.systemInfo.viewportHeight} @ ${feedbackData.systemInfo.devicePixelRatio}x DPI
• 🌍 Network: ${feedbackData.systemInfo.ip} (${feedbackData.systemInfo.connectionType})
• 📍 Page: ${feedbackData.systemInfo.url}
• 🗣️ Language: ${feedbackData.systemInfo.language}
• ⏰ Timezone: ${feedbackData.systemInfo.timezone}
${feedbackData.systemInfo.touchSupported ? '• 👆 Touch device detected\n' : ''}
• 📸 Screenshot: Full resolution (${feedbackData.screenshot ? 'captured' : 'N/A'})
• ✏️ Annotations: ${feedbackData.annotations.length} drawings
• 💬 Messages: ${feedbackData.chatMessages.filter(m => m.type === 'user').length} user messages
• 🖥️ Console Logs: ${feedbackData.consoleLogs.length} entries
• 🌐 Network Logs: ${feedbackData.systemInfo.networkLogs?.length || 0} requests${replicationInfo}

Thank you for your detailed feedback!`);
    
    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    alert(`Error submitting feedback: ${message}`);
  }

  /**
   * Set authentication handler for session validation
   */
  setAuthHandler(authHandler) {
    this.authHandler = authHandler;
    this.apiClient.setAuthHandler(authHandler);
  }

  /**
   * Update API client configuration
   */
  updateConfig(newConfig) {
    if (newConfig.apiUrl) {
      this.apiClient = new ApiClient({
        apiUrl: newConfig.apiUrl,
        organizationId: newConfig.organizationId || this.options.organizationId,
        projectId: newConfig.projectId || this.options.projectId
      });
      
      // Re-connect auth handler if it exists
      if (this.authHandler) {
        this.apiClient.setAuthHandler(this.authHandler);
      }
    }
    
    this.options = { ...this.options, ...newConfig };
  }
}