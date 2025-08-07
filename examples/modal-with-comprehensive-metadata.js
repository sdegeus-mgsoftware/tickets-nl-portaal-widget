/**
 * Example: Visual Feedback Modal with Comprehensive Metadata Collection
 * Shows how to configure the modal to collect everything and create tickets
 */

import VisualFeedbackModal from '../src/components/visual-feedback-modal.js';

// 🌟 ULTIMATE Configuration - Comprehensive metadata + ticket creation
const comprehensiveModal = new VisualFeedbackModal({
  // API Configuration
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-organization-id',
  projectId: 'your-default-project-id',
  
  // Enable comprehensive metadata collection
  enableComprehensiveMetadata: true,
  
  // Create tickets instead of generic feedback
  createTickets: true,
  
  // Visual feedback options
  enableScreenRecording: true,
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  // Theme and appearance
  theme: 'default',
  
  // Callbacks
  onOpen: () => {
    console.log('🎯 Feedback modal opened - comprehensive metadata will be collected on submission');
  },
  
  onClose: () => {
    console.log('📴 Feedback modal closed');
  },
  
  onSubmit: (data) => {
    console.log('🎉 Feedback submitted with comprehensive context!');
    console.log('📋 Ticket:', data.ticket);
    console.log('📊 Metadata size:', JSON.stringify(data.metadata).length, 'bytes');
    console.log('🎬 Recording:', data.replicationData?.duration, 'ms');
    console.log('📸 Screenshot:', !!data.screenshot);
    console.log('✏️ Annotations:', data.annotations.length);
    
    // Optional: Send to analytics
    if (window.gtag) {
      window.gtag('event', 'feedback_submitted', {
        ticket_number: data.ticket?.ticket_number,
        metadata_size: JSON.stringify(data.metadata).length,
        has_screenshot: !!data.screenshot,
        annotation_count: data.annotations.length,
        message_count: data.chatMessages.filter(m => m.type === 'user').length
      });
    }
  }
});

// 🎯 Smart Configuration - Metadata based on feedback type
const smartModal = new VisualFeedbackModal({
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-organization-id',
  
  // Enable smart metadata collection
  enableComprehensiveMetadata: true,
  createTickets: true,
  
  // Customize metadata collection based on content
  onSubmit: async (data) => {
    const userMessages = data.chatMessages.filter(m => m.type === 'user');
    const messageText = userMessages.map(m => m.content.toLowerCase()).join(' ');
    
    // Analyze feedback type and adjust metadata accordingly
    let feedbackType = 'general';
    if (messageText.includes('bug') || messageText.includes('error') || messageText.includes('broken')) {
      feedbackType = 'bug';
    } else if (messageText.includes('feature') || messageText.includes('request') || messageText.includes('suggestion')) {
      feedbackType = 'feature';
    } else if (messageText.includes('question') || messageText.includes('help') || messageText.includes('how')) {
      feedbackType = 'question';
    }
    
    console.log(`🎯 Detected feedback type: ${feedbackType}`);
    console.log(`📊 Metadata optimized for ${feedbackType} category`);
    
    // Log metadata insights
    const metadata = data.metadata;
    if (metadata.performance?.metrics?.page_load_time > 3000) {
      console.log('⚠️ Slow page load detected:', metadata.performance.metrics.page_load_time, 'ms');
    }
    
    if (metadata.errors?.console_errors?.length > 0) {
      console.log('❌ Console errors detected:', metadata.errors.console_errors.length);
    }
    
    if (metadata.environment?.is_development) {
      console.log('🔧 Development environment detected');
    }
  }
});

// 📊 Analytics Configuration - Focus on data collection
const analyticsModal = new VisualFeedbackModal({
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-organization-id',
  
  enableComprehensiveMetadata: true,
  createTickets: true,
  
  onSubmit: (data) => {
    // Comprehensive analytics tracking
    const metadata = data.metadata;
    
    const analyticsData = {
      // Device & Browser
      device_type: metadata.display?.window?.inner_width < 768 ? 'mobile' : 'desktop',
      browser: metadata.browser?.browser_details?.version,
      os: metadata.system?.os_details?.details,
      
      // Performance
      page_load_time: metadata.performance?.metrics?.page_load_time,
      memory_usage: metadata.performance?.memory?.used_js_heap_size,
      
      // Network
      connection_type: metadata.network?.connection?.effective_type,
      online_status: metadata.network?.online,
      
      // Interaction
      screenshot_captured: !!data.screenshot,
      annotations_count: data.annotations.length,
      messages_count: data.chatMessages.filter(m => m.type === 'user').length,
      console_errors: metadata.errors?.console_errors?.length || 0,
      
      // Context
      page_url: metadata.page?.url,
      user_agent: metadata.browser?.user_agent,
      timezone: metadata.system?.timezone?.name,
      
      // Widget usage
      screen_recording: !!data.replicationData,
      recording_duration: data.replicationData?.duration || 0,
      
      // Metadata size
      metadata_size_kb: Math.round(JSON.stringify(metadata).length / 1024)
    };
    
    console.log('📈 Analytics data collected:', analyticsData);
    
    // Send to your analytics platform
    // Example: mixpanel.track('feedback_submitted', analyticsData);
    // Example: amplitude.logEvent('feedback_submitted', analyticsData);
  }
});

// 🔧 Development Configuration - Maximum debugging info
const devModal = new VisualFeedbackModal({
  apiUrl: 'http://localhost:3000/api', // Local development
  organizationId: 'dev-org',
  
  enableComprehensiveMetadata: true,
  createTickets: true,
  
  // Enable all debugging features
  enableScreenRecording: true,
  enableConsoleLogging: true,
  enableNetworkLogging: true,
  
  onOpen: () => {
    console.log('🔧 DEV MODE: Feedback modal opened');
    console.log('📊 Will collect comprehensive metadata on submission');
  },
  
  onSubmit: (data) => {
    console.log('🔧 DEV MODE: Full feedback data:');
    console.log(data);
    
    // Log metadata breakdown
    const metadata = data.metadata;
    console.log('📊 Metadata breakdown:');
    console.log('  🌐 Page:', Object.keys(metadata.page || {}).length, 'fields');
    console.log('  🔍 Browser:', Object.keys(metadata.browser || {}).length, 'fields');
    console.log('  💻 System:', Object.keys(metadata.system || {}).length, 'fields');
    console.log('  📡 Network:', Object.keys(metadata.network || {}).length, 'fields');
    console.log('  ⚡ Performance:', Object.keys(metadata.performance || {}).length, 'fields');
    console.log('  📺 Display:', Object.keys(metadata.display || {}).length, 'fields');
    console.log('  🎯 Interaction:', Object.keys(metadata.interaction || {}).length, 'fields');
    console.log('  💾 Storage:', Object.keys(metadata.storage || {}).length, 'fields');
    console.log('  🎛️ Capabilities:', Object.keys(metadata.capabilities || {}).length, 'fields');
    console.log('  ❌ Errors:', Object.keys(metadata.errors || {}).length, 'fields');
    console.log('  🏗️ Environment:', Object.keys(metadata.environment || {}).length, 'fields');
    
    // Save to localStorage for debugging
    localStorage.setItem('lastFeedbackData', JSON.stringify(data, null, 2));
    console.log('💾 Full data saved to localStorage.lastFeedbackData');
  }
});

// 🎮 Usage Examples

// Example 1: Initialize comprehensive modal
function initComprehensiveModal() {
  console.log('🌟 Initializing comprehensive feedback modal...');
  return comprehensiveModal;
}

// Example 2: Initialize with custom configuration
function initCustomModal(config) {
  return new VisualFeedbackModal({
    // Base configuration
    apiUrl: config.apiUrl,
    organizationId: config.organizationId,
    projectId: config.projectId,
    
    // Always enable comprehensive metadata
    enableComprehensiveMetadata: true,
    createTickets: true,
    
    // Merge custom options
    ...config.customOptions,
    
    // Wrap onSubmit to add metadata logging
    onSubmit: (data) => {
      console.log('🎉 Ticket created with comprehensive metadata!');
      console.log('📋 Ticket #:', data.ticket?.ticket_number);
      console.log('📊 Metadata size:', JSON.stringify(data.metadata).length, 'bytes');
      
      // Call custom onSubmit if provided
      if (config.customOptions?.onSubmit) {
        config.customOptions.onSubmit(data);
      }
    }
  });
}

// Example 3: Test metadata collection without submitting
async function testMetadataCollection() {
  console.log('🧪 Testing metadata collection...');
  
  // Import MetadataCollector directly
  const { MetadataCollector } = await import('../src/utils/metadata-collector.js');
  
  const startTime = performance.now();
  const metadata = await MetadataCollector.collectAll();
  const endTime = performance.now();
  
  console.log(`⏱️ Collection took: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📦 Size: ${JSON.stringify(metadata).length.toLocaleString()} bytes`);
  console.log('🔍 Collected metadata:', metadata);
  
  return metadata;
}

// Export for use
export {
  comprehensiveModal,
  smartModal,
  analyticsModal,
  devModal,
  initComprehensiveModal,
  initCustomModal,
  testMetadataCollection
};

// Auto-initialize in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔧 Development mode detected');
  console.log('💡 Available functions:');
  console.log('  - initComprehensiveModal()');
  console.log('  - testMetadataCollection()');
  console.log('  - devModal (already initialized)');
  
  // Make functions globally available for testing
  window.feedbackModal = {
    comprehensive: comprehensiveModal,
    smart: smartModal,
    analytics: analyticsModal,
    dev: devModal,
    init: initComprehensiveModal,
    test: testMetadataCollection
  };
}