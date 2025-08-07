/**
 * Modal Data Structure Example
 * Shows what data the modal collects and passes to tickets
 */

// 📊 Example of data collected from the modal
const exampleModalData = {
  // Screenshots and annotations
  screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...", // Base64 image data
  annotations: [
    {
      type: "arrow",
      x: 100,
      y: 200,
      endX: 150,
      endY: 250,
      color: "#ff0000"
    },
    {
      type: "text",
      x: 200,
      y: 100,
      text: "This is broken",
      color: "#ff0000"
    }
  ],

  // Chat messages (user and AI responses)
  chatMessages: [
    {
      type: "user",
      content: "The login button is not working properly",
      timestamp: "2024-01-15T10:30:00.000Z"
    },
    {
      type: "ai",
      content: "I understand you're having trouble with the login button. Can you describe what happens when you click it?",
      timestamp: "2024-01-15T10:30:05.000Z"
    },
    {
      type: "user", 
      content: "Nothing happens when I click it. No error message, no loading state.",
      timestamp: "2024-01-15T10:30:30.000Z"
    }
  ],

  // Console logs (RAW JSON data)
  consoleLogs: [
    {
      level: "error",
      message: "TypeError: Cannot read property 'click' of null",
      timestamp: "2024-01-15T10:29:45.000Z",
      source: "login.js:45"
    },
    {
      level: "warn",
      message: "React component mounted without key prop",
      timestamp: "2024-01-15T10:29:30.000Z",
      source: "UserForm.jsx:12"
    },
    {
      level: "info",
      message: "User authentication attempt",
      timestamp: "2024-01-15T10:30:00.000Z",
      source: "auth.js:128"
    }
  ],

  // System information
  systemInfo: {
    // Browser info
    browser: "Chrome",
    browserVersion: "118.0.5993.89",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    
    // System info
    os: "Windows",
    platform: "Win32",
    
    // Display info
    viewportWidth: 1920,
    viewportHeight: 1080,
    devicePixelRatio: 1.25,
    
    // Page info
    url: "https://example.com/dashboard",
    language: "en-US",
    timezone: "America/New_York",
    
    // Network info
    ip: "203.0.113.195",
    connectionType: "4g",
    
    // Network logs
    networkLogs: [
      {
        url: "/api/auth/login",
        method: "POST",
        status: 500,
        timestamp: "2024-01-15T10:30:00.000Z"
      },
      {
        url: "/api/user/profile",
        method: "GET", 
        status: 200,
        timestamp: "2024-01-15T10:29:55.000Z"
      }
    ],
    
    // Device capabilities
    touchSupported: false
  },

  // Submission timestamp
  submittedAt: "2024-01-15T10:35:00.000Z"
};

// 🎫 Example of ticket metadata that gets created
const exampleTicketMetadata = {
  feedback_context: {
    widget_version: "1.2.0",
    submission_method: "visual_feedback_modal",
    submitted_at: "2024-01-15T10:35:00.000Z",
    
    // User messages (cleaned)
    user_messages: [
      {
        type: "user", 
        content: "The login button is not working properly",
        timestamp: "2024-01-15T10:30:00.000Z"
      },
      {
        type: "user",
        content: "Nothing happens when I click it. No error message, no loading state.",
        timestamp: "2024-01-15T10:30:30.000Z"
      }
    ],
    
    // Visual feedback summary
    screenshot_captured: true,
    annotations_count: 2,
    
    // Console logs (RAW JSON - all the data!)
    console_logs: [
      {
        level: "error",
        message: "TypeError: Cannot read property 'click' of null",
        timestamp: "2024-01-15T10:29:45.000Z",
        source: "login.js:45"
      },
      {
        level: "warn", 
        message: "React component mounted without key prop",
        timestamp: "2024-01-15T10:29:30.000Z",
        source: "UserForm.jsx:12"
      }
      // ... all console logs included as raw JSON
    ],
    
    // System info (complete)
    system_info: {
      // All the system info data from above
    }
  }
};

// 📋 Example ticket description generated
const exampleTicketDescription = `
## User Feedback

### User Messages:
1. The login button is not working properly
2. Nothing happens when I click it. No error message, no loading state.

### Visual Feedback Data:
- **Screenshot**: ✅ Captured
- **Annotations**: 2 drawings
- **Console Logs**: 3 entries (raw JSON included in metadata)

### Page Context:
- **URL**: https://example.com/dashboard
- **User Agent**: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...
- **Viewport**: 1920×1080

### Network Info:
- **IP Address**: 203.0.113.195
- **Connection Type**: 4g
- **Network Logs**: 2 requests

### Submission Details:
- **Submitted**: 2024-01-15T10:35:00.000Z
- **Widget Version**: 1.2.0
- **Modal Data**: ✅ Included (screenshots, chat, raw console logs, system info, network info)
`;

// 🎯 What support teams get in the ticket
console.log('🎫 Support teams receive:');
console.log('  📋 Ticket with clear title and description');
console.log('  📸 Screenshot (if taken) with annotations');
console.log('  💬 User messages explaining the issue');
console.log('  🖥️ Raw console logs in JSON format');
console.log('  📊 Complete system information');
console.log('  📡 Network information and failed requests');
console.log('  🌐 Page context and user environment');

// 💡 Usage in your application
const modalUsageExample = `
// Initialize modal
const modal = new VisualFeedbackModal({
  apiUrl: 'https://your-portaal.com/api',
  organizationId: 'your-org-id',
  createTickets: true,
  
  onSubmit: (data) => {
    console.log('📊 Modal collected:', {
      hasScreenshot: !!data.screenshot,
      annotationsCount: data.annotations.length,
      messagesCount: data.chatMessages.filter(m => m.type === 'user').length,
      consoleLogsCount: data.consoleLogs.length,
      networkLogsCount: data.systemInfo.networkLogs?.length || 0
    });
    
    // All this data is automatically sent to your portaal as a ticket!
  }
});
`;

console.log('📚 Modal data structure documented');
console.log('💡 Check exampleModalData for complete structure');

// Export for reference
export {
  exampleModalData,
  exampleTicketMetadata,
  exampleTicketDescription,
  modalUsageExample
};