/**
 * Simple Modal Usage - Basic Feedback Data Only
 * Shows how to use the modal with tickets but without comprehensive metadata
 */

import VisualFeedbackModal from '../src/components/visual-feedback-modal.js';

// 🎯 Basic Configuration - Modal data only
const feedbackModal = new VisualFeedbackModal({
  // API Configuration
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-organization-id',
  projectId: 'your-default-project-id',
  
  // Create tickets instead of generic feedback
  createTickets: true,
  
  // Visual feedback features
  enableScreenRecording: false, // Disabled for now
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  // Theme and appearance
  theme: 'default',
  
  // Callbacks
  onOpen: () => {
    console.log('🎯 Feedback modal opened');
  },
  
  onClose: () => {
    console.log('📴 Feedback modal closed');
  },
  
  onSubmit: (data) => {
    console.log('🎉 Feedback submitted successfully!');
    console.log('📋 Ticket:', data.ticket.ticket_number);
    console.log('📸 Screenshot:', !!data.screenshot);
    console.log('✏️ Annotations:', data.annotations.length);
    console.log('💬 Messages:', data.chatMessages.filter(m => m.type === 'user').length);
    console.log('🖥️ Console logs:', data.consoleLogs.length);
    
    // Optional: Send to analytics
    if (window.gtag) {
      window.gtag('event', 'feedback_submitted', {
        ticket_number: data.ticket?.ticket_number,
        has_screenshot: !!data.screenshot,
        annotation_count: data.annotations.length,
        message_count: data.chatMessages.filter(m => m.type === 'user').length,
        console_errors: data.consoleLogs.filter(log => log.level === 'error').length
      });
    }
  }
});

// 📊 What Data Gets Collected
console.log('📊 Modal collects the following data:');
console.log('  📸 Screenshots (if taken)');
console.log('  ✏️ Annotations/drawings');
console.log('  💬 Chat messages');
console.log('  🖥️ Console logs (raw JSON data)');
console.log('  🌐 System info (browser, OS, display)');
console.log('  📡 Network info (IP, connection type, network logs)');

// 🎯 Usage Functions

function openFeedbackModal() {
  feedbackModal.show();
}

function logModalData() {
  console.log('📋 Modal components available:');
  console.log('  - Screenshot capture');
  console.log('  - Chat interface'); 
  console.log('  - Console logger');
  console.log('  - System info collector');
  console.log('  - Step replication (screen recording)');
}

function initializeForWebsite() {
  // Add feedback button to page
  const feedbackButton = document.createElement('button');
  feedbackButton.textContent = '💬 Send Feedback';
  feedbackButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: transform 0.2s;
  `;
  
  feedbackButton.addEventListener('click', openFeedbackModal);
  feedbackButton.addEventListener('mouseenter', () => {
    feedbackButton.style.transform = 'translateY(-2px)';
  });
  feedbackButton.addEventListener('mouseleave', () => {
    feedbackButton.style.transform = 'translateY(0)';
  });
  
  document.body.appendChild(feedbackButton);
  
  console.log('✅ Feedback button added to page');
}

// 🔧 Configuration Options
const modalConfigurations = {
  // Minimal configuration
  minimal: {
    apiUrl: 'https://your-portaal.com/api',
    organizationId: 'your-org-id',
    createTickets: true
  },
  
  // Full features enabled
  full: {
    apiUrl: 'https://your-portaal.com/api',
    organizationId: 'your-org-id',
    projectId: 'default-project',
    createTickets: true,
    enableScreenRecording: false, // Disabled for now
    enableConsoleLogging: true,
    enableNetworkLogging: true,
    theme: 'default'
  },
  
  // Production configuration
  production: {
    apiUrl: 'https://tickets.yourcompany.com/api',
    organizationId: 'prod-org-123',
    projectId: 'main-project',
    createTickets: true,
    enableScreenRecording: false, // Disabled
    enableConsoleLogging: false, // Disable in production for privacy
    enableNetworkLogging: false, // Disable in production for privacy
    theme: 'default',
    onSubmit: (data) => {
      // Custom analytics for production
      console.log('Production feedback submitted:', data.ticket.ticket_number);
    }
  }
};

// Export functions for use
export {
  feedbackModal,
  openFeedbackModal,
  logModalData,
  initializeForWebsite,
  modalConfigurations
};

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  console.log('🎯 Simple modal usage loaded');
  console.log('💡 Available functions:');
  console.log('  - openFeedbackModal()');
  console.log('  - initializeForWebsite()');
  console.log('  - logModalData()');
  
  // Make functions globally available for testing
  window.feedbackWidget = {
    open: openFeedbackModal,
    init: initializeForWebsite,
    log: logModalData,
    modal: feedbackModal
  };
}