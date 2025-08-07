/**
 * Comprehensive Metadata Usage Examples
 * Shows how to use the MetadataCollector for maximum context
 */

import { MetadataCollector } from '../src/utils/metadata-collector.js';
import { ApiClient } from '../src/core/api-client.js';
import { AuthClient } from '../src/utils/auth-client.js';

// Initialize clients
const config = {
  apiUrl: 'https://your-portaal-domain.com/api',
  organizationId: 'your-org-id',
  projectId: 'your-project-id'
};

const apiClient = new ApiClient(config);
const authClient = new AuthClient(config.apiUrl);

// 🌟 ULTIMATE METADATA EXAMPLE - Everything possible
async function createUltimateTicket() {
  console.log('🚀 Starting ultimate metadata collection...');
  
  const startTime = performance.now();
  
  // Get comprehensive metadata
  const metadata = await MetadataCollector.collectAll();
  
  const endTime = performance.now();
  console.log(`⏱️ Metadata collection took ${endTime - startTime}ms`);
  console.log(`📊 Metadata size: ${JSON.stringify(metadata).length} bytes`);
  
  // Log what we collected
  console.log('📋 Collected data includes:');
  console.log(`  📄 Page: ${metadata.page.document.title}`);
  console.log(`  🌐 Browser: ${metadata.browser.browser_details.version}`);
  console.log(`  💻 OS: ${metadata.system.os_details.details}`);
  console.log(`  📱 Screen: ${metadata.display.screen.width}x${metadata.display.screen.height}`);
  console.log(`  🔌 Online: ${metadata.network.online}`);
  console.log(`  ⚡ Performance: ${metadata.performance.metrics.page_load_time}ms`);
  console.log(`  🎯 Capabilities: ${Object.keys(metadata.capabilities).length} checked`);
  console.log(`  ❌ Errors: ${metadata.errors.console_errors.length} tracked`);
  
  const authState = authClient.getState();
  if (!authState.isAuthenticated) {
    console.error('❌ User not authenticated');
    return;
  }

  const ticketData = {
    title: 'Ultimate Bug Report with Full Context',
    description: `
This ticket was created with COMPREHENSIVE metadata collection.

The system has automatically captured:
- Complete browser and system information
- Page context and performance metrics  
- Network conditions and capabilities
- Error history and user interactions
- Display settings and device details
- And much more...

This provides maximum context for debugging and support.
    `,
    category: 'bug',
    priority: 'high',
    requester_id: authState.user.id,
    metadata: {
      ...metadata,
      
      // Add collection info
      collection_info: {
        method: 'comprehensive',
        collection_time_ms: endTime - startTime,
        size_bytes: JSON.stringify(metadata).length,
        timestamp: new Date().toISOString(),
        widget_version: '1.2.0'
      },
      
      // User provided context
      user_context: {
        issue_description: 'Complete system context capture test',
        expected_behavior: 'All metadata should be collected',
        actual_behavior: 'Testing comprehensive collection',
        reproduction_steps: [
          '1. Opened feedback widget',
          '2. Selected comprehensive metadata option',
          '3. Filled out form',
          '4. Submitted ticket'
        ]
      }
    }
  };

  console.log('🎯 Creating ticket with ultimate metadata...');
  
  try {
    const result = await apiClient.createTicket(ticketData);
    
    if (result.success) {
      console.log('✅ Ultimate ticket created successfully!');
      console.log(`📋 Ticket #: ${result.data.ticket.ticket_number}`);
      console.log(`🆔 Ticket ID: ${result.data.ticket.id}`);
      return result.data.ticket;
    } else {
      console.error('❌ Failed to create ticket:', result.error);
      return null;
    }
  } catch (error) {
    console.error('💥 Error creating ultimate ticket:', error);
    return null;
  }
}

// 🎨 Visual demonstration of collected data
async function demonstrateMetadataCollection() {
  console.log('🎨 === METADATA COLLECTION DEMONSTRATION ===');
  
  // Show what we're about to collect
  console.log('🔍 About to collect comprehensive metadata...');
  console.log('📊 This includes:');
  console.log('  • Page context (URL, title, referrer, scroll position)');
  console.log('  • Browser info (user agent, language, features)');
  console.log('  • System info (OS, hardware, timezone)');
  console.log('  • Network info (connection type, speed, IP)');
  console.log('  • Performance metrics (load times, memory usage)');
  console.log('  • Display info (screen size, device pixel ratio)');
  console.log('  • Interaction context (mouse position, focus)');
  console.log('  • Storage capabilities (localStorage, cookies)');
  console.log('  • Browser capabilities (WebRTC, WebGL, etc.)');
  console.log('  • Error history (console errors, JS errors)');
  console.log('  • Environment detection (dev/prod, frameworks)');
  
  const startTime = performance.now();
  const metadata = await MetadataCollector.collectAll();
  const endTime = performance.now();
  
  console.log('');
  console.log('✅ === COLLECTION COMPLETE ===');
  console.log(`⏱️  Collection time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`📦 Total size: ${JSON.stringify(metadata).length.toLocaleString()} bytes`);
  
  // Show collected data summary
  console.log('');
  console.log('📋 === COLLECTED DATA SUMMARY ===');
  
  // Page info
  console.log(`🌐 Page: ${metadata.page.title}`);
  console.log(`📍 URL: ${metadata.page.url}`);
  console.log(`📄 Protocol: ${metadata.page.protocol}`);
  
  // Browser info
  const browser = metadata.browser.browser_details;
  console.log(`🔍 Browser: ${Object.keys(browser).find(k => browser[k] && k !== 'version')} ${browser.version}`);
  console.log(`🗣️  Language: ${metadata.browser.language}`);
  console.log(`🔌 Online: ${metadata.browser.online ? '✅' : '❌'}`);
  
  // System info
  console.log(`💻 OS: ${metadata.system.os_details.details}`);
  console.log(`🕐 Timezone: ${metadata.system.timezone.name}`);
  console.log(`⚡ CPU Cores: ${metadata.system.hardware_concurrency || 'Unknown'}`);
  console.log(`💾 Device Memory: ${metadata.system.device_memory || 'Unknown'}GB`);
  
  // Display info
  console.log(`📺 Screen: ${metadata.display.screen.width}x${metadata.display.screen.height}`);
  console.log(`🖥️  Window: ${metadata.display.window.inner_width}x${metadata.display.window.inner_height}`);
  console.log(`📱 Device Pixel Ratio: ${metadata.display.window.device_pixel_ratio}`);
  
  // Network info
  if (metadata.network.connection) {
    console.log(`📡 Connection: ${metadata.network.connection.effective_type}`);
    console.log(`⬇️  Downlink: ${metadata.network.connection.downlink}Mbps`);
  }
  
  // Performance info
  if (metadata.performance.metrics) {
    console.log(`🚀 Page Load: ${metadata.performance.metrics.page_load_time}ms`);
    console.log(`🏗️  DOM Ready: ${metadata.performance.metrics.dom_ready_time}ms`);
  }
  
  // Memory info
  if (metadata.performance.memory) {
    const memoryMB = (metadata.performance.memory.used_js_heap_size / 1024 / 1024).toFixed(1);
    console.log(`🧠 JS Memory: ${memoryMB}MB`);
  }
  
  // Capabilities
  const capabilities = metadata.capabilities;
  const capabilityCount = Object.keys(capabilities).length;
  console.log(`🎛️  Capabilities checked: ${capabilityCount}`);
  
  // Errors
  const errorCount = metadata.errors.console_errors.length + metadata.errors.js_errors.length;
  console.log(`❌ Errors tracked: ${errorCount}`);
  
  // Environment
  console.log(`🏗️  Development: ${metadata.environment.is_development ? '✅' : '❌'}`);
  console.log(`🤖 Automation: ${Object.values(metadata.environment.automation_detected).some(v => v) ? '⚠️' : '❌'}`);
  
  console.log('');
  console.log('🎉 === DEMONSTRATION COMPLETE ===');
  
  return metadata;
}

// 📊 Metadata analysis and insights
function analyzeMetadata(metadata) {
  console.log('📊 === METADATA ANALYSIS ===');
  
  const insights = {
    device_type: 'unknown',
    performance_category: 'unknown',
    user_behavior: {},
    technical_insights: {},
    support_priority: 'medium'
  };
  
  // Device type analysis
  if (metadata.display.window.inner_width < 768) {
    insights.device_type = 'mobile';
  } else if (metadata.display.window.inner_width < 1024) {
    insights.device_type = 'tablet';
  } else {
    insights.device_type = 'desktop';
  }
  
  // Performance analysis
  if (metadata.performance.metrics) {
    const loadTime = metadata.performance.metrics.page_load_time;
    if (loadTime < 1000) {
      insights.performance_category = 'excellent';
    } else if (loadTime < 3000) {
      insights.performance_category = 'good';
    } else if (loadTime < 5000) {
      insights.performance_category = 'average';
    } else {
      insights.performance_category = 'poor';
    }
  }
  
  // User behavior insights
  if (metadata.interaction.last_mouse_position) {
    insights.user_behavior.mouse_tracked = true;
  }
  
  if (metadata.page.document.scroll_position.y > 0) {
    insights.user_behavior.has_scrolled = true;
  }
  
  // Technical insights
  insights.technical_insights = {
    modern_browser: metadata.capabilities.webgl.available && metadata.capabilities.webassembly.available,
    mobile_device: /Mobile|Android|iPhone|iPad/i.test(metadata.browser.user_agent),
    high_dpi: metadata.display.window.device_pixel_ratio > 1,
    fast_connection: metadata.network.connection?.effective_type === '4g',
    sufficient_memory: metadata.system.device_memory >= 4
  };
  
  // Support priority
  const errorCount = metadata.errors.console_errors.length + metadata.errors.js_errors.length;
  if (errorCount > 10 || insights.performance_category === 'poor') {
    insights.support_priority = 'high';
  } else if (errorCount > 5 || insights.performance_category === 'average') {
    insights.support_priority = 'medium';
  } else {
    insights.support_priority = 'low';
  }
  
  console.log(`📱 Device Type: ${insights.device_type}`);
  console.log(`⚡ Performance: ${insights.performance_category}`);
  console.log(`🎯 Support Priority: ${insights.support_priority}`);
  console.log(`🔧 Modern Browser: ${insights.technical_insights.modern_browser ? '✅' : '❌'}`);
  console.log(`📶 Fast Connection: ${insights.technical_insights.fast_connection ? '✅' : '❌'}`);
  
  return insights;
}

// 🎮 Interactive demo
async function runInteractiveDemo() {
  console.log('🎮 === INTERACTIVE METADATA DEMO ===');
  console.log('This demo will show you exactly what metadata is collected...');
  
  // Step 1: Basic collection
  console.log('\n📋 Step 1: Collecting basic metadata...');
  const basicData = {
    page: MetadataCollector.getPageContext(),
    browser: MetadataCollector.getBrowserInfo(),
    display: MetadataCollector.getDisplayInfo()
  };
  console.log('✅ Basic data collected');
  
  // Step 2: System info
  console.log('\n💻 Step 2: Gathering system information...');
  const systemData = MetadataCollector.getSystemInfo();
  console.log('✅ System data collected');
  
  // Step 3: Network info (async)
  console.log('\n📡 Step 3: Checking network conditions...');
  const networkData = await MetadataCollector.getNetworkInfo();
  console.log('✅ Network data collected');
  
  // Step 4: Performance metrics
  console.log('\n⚡ Step 4: Measuring performance...');
  const performanceData = MetadataCollector.getPerformanceInfo();
  console.log('✅ Performance data collected');
  
  // Step 5: Capabilities check
  console.log('\n🎛️  Step 5: Testing browser capabilities...');
  const capabilitiesData = await MetadataCollector.getCapabilities();
  console.log('✅ Capabilities data collected');
  
  // Combine everything
  const fullMetadata = {
    ...basicData,
    system: systemData,
    network: networkData,
    performance: performanceData,
    capabilities: capabilitiesData,
    collection_timestamp: new Date().toISOString()
  };
  
  console.log('\n🎉 Demo complete! Full metadata object ready.');
  console.log(`📦 Total size: ${JSON.stringify(fullMetadata).length.toLocaleString()} bytes`);
  
  return fullMetadata;
}

// Export examples
export {
  createUltimateTicket,
  demonstrateMetadataCollection,
  analyzeMetadata,
  runInteractiveDemo
};

// Auto-run demonstration when loaded (if in development)
if (MetadataCollector.isDevelopment()) {
  console.log('🔧 Development mode detected - metadata collector ready!');
  console.log('💡 Try: await demonstrateMetadataCollection()');
  console.log('💡 Try: await createUltimateTicket()');
  console.log('💡 Try: await runInteractiveDemo()');
}