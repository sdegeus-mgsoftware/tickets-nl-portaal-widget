# Comprehensive Ticket Metadata Support

The widget now supports comprehensive metadata collection when creating tickets. This metadata is stored in the `custom_fields` JSONB column and can capture **everything** about the user's environment, system, and context.

## 🌟 ULTIMATE Metadata Collection

Using the `MetadataCollector`, you can capture **EVERYTHING**:

```javascript
import { MetadataCollector } from '../src/utils/metadata-collector.js';

// Collect EVERYTHING possible
const metadata = await MetadataCollector.collectAll();

// Create ticket with comprehensive context
const result = await apiClient.createTicket({
  title: 'Issue with full context',
  description: 'All system information captured',
  requester_id: 'user-123',
  metadata // Contains EVERYTHING
});
```

## 📊 What Gets Collected

The comprehensive metadata includes:

### 🌐 Page Context
- URL, title, referrer, protocol
- Document state, character set, meta tags
- Scroll position, document dimensions
- Visibility state, focus information

### 🔍 Browser Information
- User agent, language, platform details
- Browser detection (Chrome, Firefox, Safari, etc.)
- Features (Java, cookies, PDF viewer)
- Online status, WebDriver detection

### 💻 System Information  
- Hardware (CPU cores, device memory, touch points)
- Operating system detection and version
- Timezone information and locale
- System date/time in multiple formats

### 📡 Network Information
- Connection type and speed (4G, WiFi, etc.)
- Bandwidth measurements (downlink, RTT)
- Data saver mode detection
- Public IP address (if accessible)

### ⚡ Performance Metrics
- Page load timing (navigation, DOM, resources)
- Memory usage (JS heap size and limits)
- Navigation type and redirect count
- Real-time performance measurements

### 📺 Display & Device
- Screen resolution and color depth
- Window dimensions and position
- Device pixel ratio
- Orientation and media query matches

### 🎯 User Interaction Context
- Mouse position tracking
- Active element information
- Page lifecycle state
- Form interaction patterns

### 💾 Storage & Capabilities
- LocalStorage, SessionStorage availability
- IndexedDB and WebSQL support
- Browser permissions (camera, mic, etc.)
- WebRTC, WebGL, WebAssembly support

### ❌ Error Context
- Console errors and warnings
- JavaScript runtime errors
- Unhandled promise rejections
- Error tracking status

### 🏗️ Environment Detection
- Development vs production detection
- Framework detection (React, Vue, Angular)
- Ad blocker presence
- Browser automation detection

## 🚀 Usage Examples

### 🌟 Ultimate Collection - EVERYTHING
```javascript
import { MetadataCollector } from '../src/utils/metadata-collector.js';

// Collect ALL possible metadata (comprehensive system snapshot)
const metadata = await MetadataCollector.collectAll();

const result = await apiClient.createTicket({
  title: 'Complex issue with full context',
  description: 'Issue description with complete system context',
  requester_id: 'user-123',
  metadata // Contains 100+ data points about user's environment
});

console.log('📊 Metadata size:', JSON.stringify(metadata).length, 'bytes');
```

### 🎯 Smart Collection - Based on Issue Type
```javascript
// Different metadata based on issue category
let metadata = { widget_version: '1.2.0', timestamp: new Date().toISOString() };

switch (issueType) {
  case 'bug':
    // For bugs, collect technical details
    const techData = await MetadataCollector.collectAll();
    metadata = {
      ...metadata,
      system: techData.system,
      browser: techData.browser,
      performance: techData.performance,
      errors: techData.errors
    };
    break;
    
  case 'feature':
    // For features, focus on user context
    metadata.user_context = {
      display: MetadataCollector.getDisplayInfo(),
      usage_pattern: 'power_user'
    };
    break;
    
  case 'question':
    // For questions, minimal metadata
    metadata.page_context = MetadataCollector.getPageContext();
    break;
}

await apiClient.createTicket({
  title: 'Smart ticket with contextual metadata',
  category: issueType,
  metadata
});
```

### ⚡ Performance Optimized Collection
```javascript
// Collect metadata in parallel for better performance
const [pageData, browserData, systemData, displayData] = await Promise.all([
  Promise.resolve(MetadataCollector.getPageContext()),
  Promise.resolve(MetadataCollector.getBrowserInfo()),
  Promise.resolve(MetadataCollector.getSystemInfo()),
  Promise.resolve(MetadataCollector.getDisplayInfo())
]);

const metadata = {
  collection_method: 'parallel_optimized',
  page: pageData,
  browser: browserData,
  system: systemData,
  display: displayData
};
```

### 📊 Real-time Form Analytics
```javascript
import { RealTimeMetadataWidget } from '../examples/ticket-creation-example.js';

// Track user interactions in real-time
const realTimeWidget = new RealTimeMetadataWidget(apiClient, authClient);

// This automatically tracks:
// - Field focus/blur times
// - Typing patterns and speed
// - Form completion order
// - Hesitation points
// - Paste events

// When creating ticket, includes comprehensive interaction data
await realTimeWidget.createTicketWithRealTimeData(ticketInfo);
```

### 🎨 Demonstration Mode
```javascript
import { demonstrateMetadataCollection } from '../examples/comprehensive-metadata-usage.js';

// Shows exactly what gets collected with detailed logging
const metadata = await demonstrateMetadataCollection();

// Output example:
// 🌐 Page: My Application Dashboard
// 🔍 Browser: Chrome 118.0
// 💻 OS: Windows 10
// 📺 Screen: 1920x1080
// 📡 Connection: 4g
// 🚀 Page Load: 1247ms
// 🧠 JS Memory: 45.2MB
// 🎛️ Capabilities checked: 12
// ❌ Errors tracked: 0
```

### Basic Metadata (Lightweight)
```javascript
const result = await apiClient.createTicket({
  title: 'Simple issue',
  description: 'Basic ticket with minimal context',
  requester_id: 'user-123',
  metadata: {
    created_from: 'widget',
    page_url: window.location.href,
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent
  }
});
```

### Alternative Field Name
You can also use `custom_fields` instead of `metadata`:
```javascript
const result = await apiClient.createTicket({
  title: 'Issue with login',
  custom_fields: {
    source: 'feedback_widget',
    version: '1.0.0'
  }
});
```

## Common Metadata Examples

### Widget Context
```javascript
metadata: {
  created_from: 'widget',
  widget_version: '1.2.0',
  integration: 'website_feedback'
}
```

### User Context
```javascript
metadata: {
  page_url: window.location.href,
  user_agent: navigator.userAgent,
  screen_resolution: `${screen.width}x${screen.height}`,
  referrer: document.referrer
}
```

### Issue Context
```javascript
metadata: {
  error_code: 'AUTH_001',
  steps_taken: ['clicked login', 'entered credentials', 'clicked submit'],
  browser_console_errors: ['TypeError: Cannot read property...'],
  reproduction_rate: '3/3 attempts'
}
```

### Tracking & Analytics
```javascript
metadata: {
  session_id: 'sess_abc123',
  feature_flags: ['new_ui', 'beta_features'],
  user_segment: 'premium',
  campaign_source: 'email_newsletter'
}
```

### Technical Details
```javascript
metadata: {
  browser_info: {
    name: 'Chrome',
    version: '118.0.0.0',
    language: navigator.language
  },
  device_info: {
    platform: navigator.platform,
    memory: navigator.deviceMemory,
    connection: navigator.connection?.effectiveType
  }
}
```

## Data Structure

Metadata is stored as JSONB in PostgreSQL, which means:
- ✅ Any valid JSON structure is supported
- ✅ Nested objects and arrays work
- ✅ Efficient querying and indexing
- ✅ Automatic validation

### Example Complete Metadata
```javascript
metadata: {
  // Source information
  source: {
    type: 'widget',
    version: '1.2.0',
    integration: 'customer_portal'
  },
  
  // Context
  context: {
    page: {
      url: window.location.href,
      title: document.title,
      path: window.location.pathname
    },
    user: {
      agent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  },
  
  // Issue details
  issue: {
    category: 'technical',
    severity: 'medium',
    affects_functionality: true,
    first_occurrence: '2024-01-15T10:30:00Z'
  },
  
  // Tracking
  tracking: {
    session_id: 'sess_abc123',
    correlation_id: 'corr_xyz789',
    created_at: new Date().toISOString()
  }
}
```

## Querying Metadata

In your portaal application, you can query tickets by metadata:

```sql
-- Find tickets created from widget
SELECT * FROM tickets 
WHERE custom_fields->>'created_from' = 'widget';

-- Find tickets with specific error codes
SELECT * FROM tickets 
WHERE custom_fields->>'error_code' = 'AUTH_001';

-- Find tickets with nested data
SELECT * FROM tickets 
WHERE custom_fields->'source'->>'type' = 'widget';
```

## Best Practices

### 1. Use Consistent Keys
```javascript
// Good - consistent naming
metadata: {
  created_from: 'widget',
  created_at: new Date().toISOString()
}

// Avoid - inconsistent naming  
metadata: {
  source: 'widget',
  timestamp: new Date().toISOString()
}
```

### 2. Structure Related Data
```javascript
// Good - grouped logically
metadata: {
  user_context: {
    page_url: '...',
    user_agent: '...',
    screen_resolution: '...'
  },
  error_details: {
    code: 'ERR_001',
    message: '...',
    stack: '...'
  }
}

// Avoid - flat structure for related data
metadata: {
  page_url: '...',
  user_agent: '...',
  error_code: '...',
  error_message: '...'
}
```

### 3. Include Timestamps
```javascript
metadata: {
  created_from: 'widget',
  created_at: new Date().toISOString(),
  widget_version: '1.2.0'
}
```

### 4. Don't Include Sensitive Data
```javascript
// Good
metadata: {
  user_role: 'admin',
  feature_access: ['reports', 'analytics']
}

// Avoid - sensitive information
metadata: {
  password: '...',        // Never!
  credit_card: '...',     // Never!
  social_security: '...'  // Never!
}
```

## Size Limitations

- JSONB field can store up to 1GB of data
- For performance, keep metadata under 1MB
- Consider splitting large data into separate fields or tables

## 📋 Complete Metadata Structure

When using `MetadataCollector.collectAll()`, here's the complete structure:

```javascript
{
  // Collection info
  collection_timestamp: "2024-01-15T10:30:00.000Z",
  session_id: "sess_abc123_1705319400000",
  
  // Widget info
  widget: {
    version: "1.2.0",
    created_from: "feedback_widget",
    collection_method: "comprehensive"
  },

  // Page context
  page: {
    url: "https://example.com/dashboard",
    origin: "https://example.com",
    pathname: "/dashboard",
    search: "?tab=overview",
    hash: "#section1",
    title: "Dashboard - My App",
    referrer: "https://google.com",
    protocol: "https:",
    host: "example.com",
    port: "",
    
    document: {
      ready_state: "complete",
      character_set: "UTF-8",
      content_type: "text/html",
      last_modified: "01/15/2024 10:25:00",
      cookie_enabled: true,
      domain: "example.com",
      meta_tags: {
        "viewport": "width=device-width, initial-scale=1",
        "description": "My application dashboard"
      },
      scroll_position: { x: 0, y: 150 },
      document_size: { width: 1200, height: 2400 }
    }
  },

  // Browser information
  browser: {
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
    language: "en-US",
    languages: ["en-US", "en", "nl"],
    platform: "Win32",
    vendor: "Google Inc.",
    product: "Gecko",
    app_name: "Netscape",
    app_version: "5.0 (Windows NT 10.0; Win64; x64)...",
    
    browser_details: {
      chrome: true,
      firefox: false,
      safari: false,
      version: "118.0",
      mobile: false
    },
    
    java_enabled: false,
    cookie_enabled: true,
    do_not_track: null,
    online: true,
    pdf_viewer_enabled: true,
    webdriver: false
  },

  // System information
  system: {
    hardware_concurrency: 8,
    device_memory: 16,
    max_touch_points: 0,
    
    os_details: {
      windows: true,
      mac: false,
      linux: false,
      android: false,
      ios: false,
      platform: "Win32",
      details: "Windows 10/11"
    },
    
    timezone: {
      name: "America/New_York",
      offset: -300,
      locale: "en-US"
    },
    
    system_time: {
      local: "Mon Jan 15 2024 10:30:00 GMT-0500 (EST)",
      utc: "Mon, 15 Jan 2024 15:30:00 GMT",
      iso: "2024-01-15T15:30:00.000Z",
      timestamp: 1705319400000
    }
  },

  // Network information
  network: {
    online: true,
    connection: {
      effective_type: "4g",
      downlink: 10,
      downlink_max: Infinity,
      rtt: 50,
      save_data: false,
      type: "wifi"
    },
    ip_address: "203.0.113.195"
  },

  // Performance metrics
  performance: {
    timing: {
      navigation_start: 1705319395000,
      fetch_start: 1705319395001,
      domain_lookup_start: 1705319395002,
      // ... all timing events
    },
    metrics: {
      page_load_time: 1247,
      domain_lookup_time: 15,
      connect_time: 45,
      request_time: 234,
      response_time: 189,
      dom_ready_time: 987
    },
    navigation: {
      type: 0,
      redirect_count: 0
    },
    memory: {
      used_js_heap_size: 47456789,
      total_js_heap_size: 67108864,
      js_heap_size_limit: 2147483648
    },
    now: 5432.1
  },

  // Display information
  display: {
    screen: {
      width: 1920,
      height: 1080,
      available_width: 1920,
      available_height: 1040,
      color_depth: 24,
      pixel_depth: 24,
      orientation: {
        angle: 0,
        type: "landscape-primary"
      }
    },
    window: {
      inner_width: 1536,
      inner_height: 722,
      outer_width: 1550,
      outer_height: 838,
      screen_x: 184,
      screen_y: 122,
      device_pixel_ratio: 1.25,
      scroll_x: 0,
      scroll_y: 150
    },
    viewport: {
      width: 1536,
      height: 722
    },
    media_queries: {
      "max-width: 768px": false,
      "max-width: 1024px": false,
      "min-width: 1200px": true,
      "prefers-dark-scheme": false,
      "prefers-reduced-motion": false,
      "orientation: portrait": false,
      "hover: hover": true,
      "pointer: fine": true
    }
  },

  // User interaction context
  interaction: {
    last_mouse_position: {
      x: 456,
      y: 234,
      timestamp: 1705319399800
    },
    active_element: {
      tag_name: "INPUT",
      id: "search-field",
      class_name: "form-control",
      type: "text"
    },
    visibility_state: "visible",
    hidden: false,
    page_lifecycle: "visible"
  },

  // Storage information
  storage: {
    local_storage: {
      available: true,
      length: 12,
      quota_exceeded: false
    },
    session_storage: {
      available: true,
      length: 3
    },
    indexed_db: {
      available: true
    },
    web_sql: {
      available: false
    }
  },

  // Browser capabilities
  capabilities: {
    camera: "prompt",
    microphone: "denied",
    geolocation: "granted",
    notifications: "default",
    push: "denied",
    webrtc: {
      available: true
    },
    web_workers: {
      available: true
    },
    service_workers: {
      available: true
    },
    webgl: {
      available: true,
      vendor: "Google Inc. (Intel)",
      renderer: "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)",
      version: "WebGL 1.0 (OpenGL ES 2.0 Chromium)"
    },
    webassembly: {
      available: true
    }
  },

  // Error context
  errors: {
    console_errors: [
      {
        timestamp: "2024-01-15T15:29:45.000Z",
        message: "404 - Resource not found: /api/old-endpoint"
      }
    ],
    js_errors: [],
    unhandled_rejections: [],
    error_tracking_active: true
  },

  // Environment detection
  environment: {
    is_development: false,
    frameworks: {
      react: true,
      vue: false,
      angular: false,
      jquery: false
    },
    ad_blocker_detected: false,
    extensions_detected: {
      chrome_extensions_api: true
    },
    automation_detected: {
      webdriver: false,
      phantom: false,
      selenium: false,
      headless_chrome: false
    }
  }
}
```

**Size**: Typically 15-50KB depending on page complexity and error history.

## 🎯 Targeted Collection Methods

For performance or privacy reasons, you can collect specific sections:

```javascript
// Individual sections
const pageData = MetadataCollector.getPageContext();
const browserData = MetadataCollector.getBrowserInfo();
const systemData = MetadataCollector.getSystemInfo();
const networkData = await MetadataCollector.getNetworkInfo();
const performanceData = MetadataCollector.getPerformanceInfo();
const displayData = MetadataCollector.getDisplayInfo();
const interactionData = MetadataCollector.getInteractionContext();
const storageData = MetadataCollector.getStorageInfo();
const capabilitiesData = await MetadataCollector.getCapabilities();
const errorData = MetadataCollector.getErrorContext();
const environmentData = MetadataCollector.getEnvironmentInfo();
```

## Integration Notes

The API client automatically handles both `metadata` and `custom_fields` parameters:
- If you pass `metadata`, it's stored in `custom_fields`
- If you pass `custom_fields`, it's used directly
- `metadata` takes precedence if both are provided