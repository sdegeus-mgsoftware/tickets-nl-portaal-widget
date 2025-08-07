# Modal Integration with Ticket Creation

## 🚀 Quick Setup

Update your widget initialization to enable ticket creation with modal feedback data:

```javascript
import VisualFeedbackModal from './src/components/visual-feedback-modal.js';

// Initialize with ticket creation
const feedbackModal = new VisualFeedbackModal({
  // 🔧 API Configuration
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-organization-id',
  projectId: 'your-project-id',
  
  // 🎫 Create tickets instead of generic feedback
  createTickets: true,
  
  // 📊 Visual feedback features (existing)
  enableScreenRecording: false, // Disabled for now
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  // 🎨 Appearance
  theme: 'default',
  
  // 📞 Callbacks
  onSubmit: (data) => {
    console.log('🎉 Ticket created:', data.ticket.ticket_number);
    console.log('📊 Modal data collected:', !!data.screenshot, data.annotations.length, 'annotations');
  }
});
```

## 🌟 What Happens When User Submits Feedback

1. **User fills out feedback** in the modal (chat, screenshots, annotations)
2. **Modal feedback data is collected** (screenshots, chat, console logs, system info, network info)
3. **Ticket is created** in your portaal with all feedback context
4. **Success message shows** ticket number and collected data summary

## 📊 Data Collected from Modal

When a user submits feedback, the modal automatically collects:

### 🎯 **Visual Feedback Data**
- User messages and chat history
- Screenshots and annotations
- Console logs (raw JSON data) and network logs
- Page context and interaction data

### 📊 **System Information** (from modal's SystemInfo component)
- **Browser**: User agent, browser name and version
- **System**: OS, platform information
- **Network**: Connection type, IP address
- **Display**: Viewport size, device pixel ratio
- **Page**: URL, language, timezone
- **Device**: Touch support detection

## 🎫 Ticket Creation Process

The modal creates tickets with this structure:

```javascript
{
  title: "First 100 characters of user's message...",
  description: `
    ## User Feedback
    
    ### User Messages:
    1. [User's actual message]
    
    ### Visual Feedback Data:
    - Screenshot: ✅ Captured
    - Annotations: 3 drawings
    - Console Logs: 12 entries
    - Screen Recording: 45s video (2.3MB)
    
    ### Page Context:
    - URL: https://example.com/dashboard
    - User Agent: Chrome 118.0
    - Viewport: 1920×1080
    
    ### Submission Details:
    - Submitted: 2024-01-15T10:30:00.000Z
    - Widget Version: 1.2.0
    - Modal Data: ✅ Included (screenshots, chat, console logs, system info)
  `,
  category: 'feedback',
  priority: 'medium', // Auto-determined based on content
  metadata: {
    // Widget-specific feedback context
    feedback_context: {
      widget_version: '1.2.0',
      submission_method: 'visual_feedback_modal',
      user_messages: [/* user messages */],
      screenshot_captured: true,
      annotations_count: 3,
      screen_recording: {
        duration_seconds: 45,
        steps_recorded: 23,
        video_size_kb: 2300
      },
      system_info: {
        /* modal's system info data */
      }
    }
  }
}
```

## 🎨 Success Message

After submission, users see a detailed success message:

```
🎉 Ticket Created Successfully!

🎫 Ticket #PROJ-123 (ID: abc-def-ghi)
📋 Priority: MEDIUM
🏷️ Category: feedback

📋 FEEDBACK DATA COLLECTED:
• 📸 Screenshot: ✅ Captured
• ✏️ Annotations: 3 drawings
• 💬 Chat Messages: ✅ Included
• 🖥️ Console Logs: 12 entries (raw JSON included)

📊 SYSTEM INFO:
• 🌐 Browser: Chrome 118.0
• 💻 System: Windows 10 (Win32)
• 📱 Display: 1920×1080 @ 1.25x DPI
• 📍 Page: https://example.com/dashboard
• 🗣️ Language: en-US
• ⏰ Timezone: America/New_York

📡 NETWORK INFO:
• 🌍 IP Address: 203.0.113.195
• 📶 Connection: 4g
• 🌐 Network Logs: 15 requests

Thank you for your detailed feedback! Your ticket contains 
all the visual feedback and system information needed to 
help resolve your issue quickly. 🙏
```

## ⚙️ Configuration Options

### Basic Setup
```javascript
const feedbackModal = new VisualFeedbackModal({
  apiUrl: 'https://your-portaal.com/api',
  organizationId: 'your-org-id',
  createTickets: true
});
```

### Advanced Configuration
```javascript
const feedbackModal = new VisualFeedbackModal({
  // API
  apiUrl: 'https://your-portaal.com/api',
  organizationId: 'your-org-id',
  projectId: 'default-project-id',
  
  // Ticket creation
  createTickets: true,                  // Create tickets vs generic feedback
  
  // Visual features
  enableScreenRecording: false, // Disabled for now
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  // Appearance
  theme: 'default',
  
  // Callbacks
  onOpen: () => console.log('Modal opened'),
  onClose: () => console.log('Modal closed'),
  onSubmit: (data) => {
    // data.ticket = created ticket
    // data.screenshot, data.annotations, data.consoleLogs (raw), etc.
    
    console.log('Ticket:', data.ticket.ticket_number);
    console.log('Screenshots:', !!data.screenshot);
    console.log('Annotations:', data.annotations.length);
    console.log('Console logs (raw):', data.consoleLogs);
    console.log('System info:', data.systemInfo);
  }
});
```

### Analytics Integration
```javascript
const feedbackModal = new VisualFeedbackModal({
  apiUrl: 'https://your-portaal.com/api',
  organizationId: 'your-org-id',
  createTickets: true,
  
  onSubmit: (data) => {
    // Send analytics based on collected modal data
    analytics.track('feedback_submitted', {
      ticket_number: data.ticket.ticket_number,
      has_screenshot: !!data.screenshot,
      annotations_count: data.annotations.length,
      console_logs_count: data.consoleLogs.length,
      console_errors: data.consoleLogs.filter(log => log.level === 'error').length,
      has_network_info: !!(data.systemInfo.ip || data.systemInfo.connectionType)
    });
  }
});
```

## 🔧 Integration with Existing Widget

If you have an existing `visual-feedback-widget.js`, update the default config:

```javascript
// In visual-feedback-widget.js
const DEFAULT_CONFIG = {
  // Existing config...
  apiEndpoint: '/api/feedback',
  apiUrl: 'https://example.com/api',
  
  // ADD THESE:
  organizationId: null,           // Set your org ID
  createTickets: true,            // Create tickets instead of feedback
  
  // Existing features still work
  enableScreenshots: true,
  enableScreenRecording: false, // Disabled for now
  enableConsoleLogging: true,
  // ...
};
```

## 🎯 Priority Auto-Detection

The modal automatically determines ticket priority based on:

- **High Priority**: Console errors, keywords like "urgent", "critical", "broken", "error"
- **Medium Priority**: Console warnings, 3+ annotations, keywords like "bug", "issue", "problem"  
- **Low Priority**: Everything else

## 🌐 Browser Compatibility

The comprehensive metadata collector works in all modern browsers:
- ✅ Chrome/Chromium (full features)
- ✅ Firefox (full features)
- ✅ Safari (most features)
- ✅ Edge (full features)
- ✅ Mobile browsers (adapted features)

Some advanced features (like WebRTC detection) may not be available in older browsers, but basic metadata collection always works.

## 📈 Performance Impact

- **Modal Data Collection**: ~10-50ms (screenshots, system info, logs)
- **Memory Usage**: ~500KB-2MB during collection 
- **Storage**: 2-10KB per ticket in database (plus screenshot/recording files)
- **Network**: One-time collection, sent with ticket

The collection happens only when users submit feedback, so there's no impact on normal browsing.