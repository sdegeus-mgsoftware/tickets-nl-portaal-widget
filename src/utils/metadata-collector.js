/**
 * Comprehensive Metadata Collector
 * Captures all available browser, system, and context information
 */

export class MetadataCollector {
  static async collectAll() {
    const metadata = {
      // Timestamp and session
      collection_timestamp: new Date().toISOString(),
      session_id: this.generateSessionId(),
      
      // Widget information
      widget: {
        version: '1.2.0',
        created_from: 'feedback_widget',
        collection_method: 'comprehensive'
      },

      // Page context
      page: this.getPageContext(),
      
      // Browser information
      browser: this.getBrowserInfo(),
      
      // System information
      system: this.getSystemInfo(),
      
      // Network information
      network: await this.getNetworkInfo(),
      
      // Performance information
      performance: this.getPerformanceInfo(),
      
      // Screen and display
      display: this.getDisplayInfo(),
      
      // User interaction context
      interaction: this.getInteractionContext(),
      
      // Storage and state
      storage: this.getStorageInfo(),
      
      // Permissions and capabilities
      capabilities: await this.getCapabilities(),
      
      // Error context
      errors: this.getErrorContext(),
      
      // Environment detection
      environment: this.getEnvironmentInfo()
    };

    return metadata;
  }

  static getPageContext() {
    return {
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
      protocol: window.location.protocol,
      host: window.location.host,
      port: window.location.port,
      
      // Document info
      document: {
        ready_state: document.readyState,
        character_set: document.characterSet,
        content_type: document.contentType,
        last_modified: document.lastModified,
        cookie_enabled: navigator.cookieEnabled,
        domain: document.domain,
        
        // Meta tags
        meta_tags: this.getMetaTags(),
        
        // Document dimensions
        scroll_position: {
          x: window.pageXOffset || document.documentElement.scrollLeft,
          y: window.pageYOffset || document.documentElement.scrollTop
        },
        
        document_size: {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight
        }
      }
    };
  }

  static getBrowserInfo() {
    const ua = navigator.userAgent;
    
    return {
      user_agent: ua,
      language: navigator.language,
      languages: navigator.languages || [navigator.language],
      platform: navigator.platform,
      vendor: navigator.vendor,
      product: navigator.product,
      app_name: navigator.appName,
      app_version: navigator.appVersion,
      app_code_name: navigator.appCodeName,
      
      // Browser detection
      browser_details: this.detectBrowser(ua),
      
      // Features
      java_enabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
      cookie_enabled: navigator.cookieEnabled,
      do_not_track: navigator.doNotTrack,
      
      // Online status
      online: navigator.onLine,
      
      // PDF viewer
      pdf_viewer_enabled: navigator.pdfViewerEnabled,
      
      // WebDriver detection
      webdriver: navigator.webdriver || false
    };
  }

  static getSystemInfo() {
    return {
      // Hardware
      hardware_concurrency: navigator.hardwareConcurrency,
      device_memory: navigator.deviceMemory,
      max_touch_points: navigator.maxTouchPoints,
      
      // OS detection
      os_details: this.detectOS(navigator.userAgent, navigator.platform),
      
      // Timezone
      timezone: {
        name: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: new Date().getTimezoneOffset(),
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      },
      
      // Date/time
      system_time: {
        local: new Date().toString(),
        utc: new Date().toUTCString(),
        iso: new Date().toISOString(),
        timestamp: Date.now()
      }
    };
  }

  static async getNetworkInfo() {
    const networkInfo = {
      online: navigator.onLine
    };

    // Connection API (if available)
    if ('connection' in navigator) {
      const conn = navigator.connection;
      networkInfo.connection = {
        effective_type: conn.effectiveType,
        downlink: conn.downlink,
        downlink_max: conn.downlinkMax,
        rtt: conn.rtt,
        save_data: conn.saveData,
        type: conn.type
      };
    }

    // Try to get IP information (basic)
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        timeout: 2000 
      });
      if (response.ok) {
        const data = await response.json();
        networkInfo.ip_address = data.ip;
      }
    } catch (e) {
      networkInfo.ip_fetch_error = e.message;
    }

    return networkInfo;
  }

  static getPerformanceInfo() {
    const perf = window.performance;
    if (!perf) return { not_available: true };

    const timing = perf.timing;
    const navigation = perf.navigation;

    return {
      // Navigation timing
      timing: {
        navigation_start: timing.navigationStart,
        fetch_start: timing.fetchStart,
        domain_lookup_start: timing.domainLookupStart,
        domain_lookup_end: timing.domainLookupEnd,
        connect_start: timing.connectStart,
        connect_end: timing.connectEnd,
        request_start: timing.requestStart,
        response_start: timing.responseStart,
        response_end: timing.responseEnd,
        dom_loading: timing.domLoading,
        dom_interactive: timing.domInteractive,
        dom_content_loaded: timing.domContentLoadedEventStart,
        dom_complete: timing.domComplete,
        load_event_start: timing.loadEventStart,
        load_event_end: timing.loadEventEnd
      },
      
      // Calculated metrics
      metrics: {
        page_load_time: timing.loadEventEnd - timing.navigationStart,
        domain_lookup_time: timing.domainLookupEnd - timing.domainLookupStart,
        connect_time: timing.connectEnd - timing.connectStart,
        request_time: timing.responseEnd - timing.requestStart,
        response_time: timing.responseStart - timing.requestStart,
        dom_ready_time: timing.domContentLoadedEventStart - timing.navigationStart
      },
      
      // Navigation info
      navigation: {
        type: navigation.type,
        redirect_count: navigation.redirectCount
      },
      
      // Memory (if available)
      memory: perf.memory ? {
        used_js_heap_size: perf.memory.usedJSHeapSize,
        total_js_heap_size: perf.memory.totalJSHeapSize,
        js_heap_size_limit: perf.memory.jsHeapSizeLimit
      } : null,
      
      // Current time
      now: perf.now()
    };
  }

  static getDisplayInfo() {
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        available_width: screen.availWidth,
        available_height: screen.availHeight,
        color_depth: screen.colorDepth,
        pixel_depth: screen.pixelDepth,
        orientation: screen.orientation ? {
          angle: screen.orientation.angle,
          type: screen.orientation.type
        } : null
      },
      
      window: {
        inner_width: window.innerWidth,
        inner_height: window.innerHeight,
        outer_width: window.outerWidth,
        outer_height: window.outerHeight,
        screen_x: window.screenX,
        screen_y: window.screenY,
        device_pixel_ratio: window.devicePixelRatio,
        scroll_x: window.scrollX,
        scroll_y: window.scrollY
      },
      
      // Viewport
      viewport: {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      },
      
      // Media queries
      media_queries: this.getMediaQueries()
    };
  }

  static getInteractionContext() {
    return {
      // Mouse position (if tracked)
      last_mouse_position: this.getLastMousePosition(),
      
      // Focus
      active_element: document.activeElement ? {
        tag_name: document.activeElement.tagName,
        id: document.activeElement.id,
        class_name: document.activeElement.className,
        type: document.activeElement.type
      } : null,
      
      // Visibility
      visibility_state: document.visibilityState,
      hidden: document.hidden,
      
      // Page lifecycle
      page_lifecycle: this.getPageLifecycleState()
    };
  }

  static getStorageInfo() {
    const storage = {};
    
    // LocalStorage
    try {
      storage.local_storage = {
        available: typeof localStorage !== 'undefined',
        length: localStorage ? localStorage.length : 0,
        quota_exceeded: false
      };
      
      // Test quota
      try {
        const testKey = '__test_quota__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (e) {
        storage.local_storage.quota_exceeded = true;
      }
    } catch (e) {
      storage.local_storage = { error: e.message };
    }
    
    // SessionStorage
    try {
      storage.session_storage = {
        available: typeof sessionStorage !== 'undefined',
        length: sessionStorage ? sessionStorage.length : 0
      };
    } catch (e) {
      storage.session_storage = { error: e.message };
    }
    
    // IndexedDB
    storage.indexed_db = {
      available: typeof indexedDB !== 'undefined'
    };
    
    // WebSQL (deprecated but might exist)
    storage.web_sql = {
      available: typeof openDatabase !== 'undefined'
    };
    
    return storage;
  }

  static async getCapabilities() {
    const capabilities = {};
    
    // Permissions API
    if ('permissions' in navigator) {
      const permissions = ['camera', 'microphone', 'geolocation', 'notifications', 'push'];
      
      for (const permission of permissions) {
        try {
          const result = await navigator.permissions.query({ name: permission });
          capabilities[permission] = result.state;
        } catch (e) {
          capabilities[permission] = 'not_supported';
        }
      }
    }
    
    // WebRTC
    capabilities.webrtc = {
      available: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
    
    // Web Workers
    capabilities.web_workers = {
      available: typeof Worker !== 'undefined'
    };
    
    // Service Workers
    capabilities.service_workers = {
      available: 'serviceWorker' in navigator
    };
    
    // WebGL
    capabilities.webgl = this.checkWebGL();
    
    // WebAssembly
    capabilities.webassembly = {
      available: typeof WebAssembly !== 'undefined'
    };
    
    return capabilities;
  }

  static getErrorContext() {
    return {
      // Console errors (if tracked)
      console_errors: window.__widgetConsoleErrors || [],
      
      // JavaScript errors (if tracked)
      js_errors: window.__widgetJSErrors || [],
      
      // Unhandled promise rejections (if tracked)
      unhandled_rejections: window.__widgetUnhandledRejections || [],
      
      // Error tracking available
      error_tracking_active: !!(window.__widgetConsoleErrors || window.__widgetJSErrors)
    };
  }

  static getEnvironmentInfo() {
    return {
      // Development vs production detection
      is_development: this.isDevelopment(),
      
      // Framework detection
      frameworks: this.detectFrameworks(),
      
      // Ad blockers
      ad_blocker_detected: this.detectAdBlocker(),
      
      // Browser extensions (limited detection)
      extensions_detected: this.detectExtensions(),
      
      // Automation detection
      automation_detected: this.detectAutomation()
    };
  }

  // Helper methods
  static generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  static getMetaTags() {
    const metaTags = {};
    const metas = document.getElementsByTagName('meta');
    
    for (let meta of metas) {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        metaTags[name] = content;
      }
    }
    
    return metaTags;
  }

  static detectBrowser(userAgent) {
    const browsers = {
      chrome: /Chrome/i.test(userAgent),
      firefox: /Firefox/i.test(userAgent),
      safari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
      edge: /Edge/i.test(userAgent),
      ie: /MSIE|Trident/i.test(userAgent),
      opera: /Opera|OPR/i.test(userAgent)
    };
    
    // Version extraction
    let version = 'unknown';
    if (browsers.chrome) {
      const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
      version = match ? match[1] : version;
    } else if (browsers.firefox) {
      const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
      version = match ? match[1] : version;
    }
    
    return {
      ...browsers,
      version,
      mobile: /Mobile|Android|iPhone|iPad/i.test(userAgent)
    };
  }

  static detectOS(userAgent, platform) {
    return {
      windows: /Win/.test(platform),
      mac: /Mac/.test(platform),
      linux: /Linux/.test(platform),
      android: /Android/.test(userAgent),
      ios: /iPhone|iPad|iPod/.test(userAgent),
      platform: platform,
      
      // More specific detection
      details: this.getOSDetails(userAgent)
    };
  }

  static getOSDetails(userAgent) {
    if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10/11';
    if (/Windows NT 6.3/.test(userAgent)) return 'Windows 8.1';
    if (/Windows NT 6.2/.test(userAgent)) return 'Windows 8';
    if (/Windows NT 6.1/.test(userAgent)) return 'Windows 7';
    if (/Mac OS X/.test(userAgent)) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
    }
    if (/Android/.test(userAgent)) {
      const match = userAgent.match(/Android (\d+\.\d+)/);
      return match ? `Android ${match[1]}` : 'Android';
    }
    if (/iPhone OS/.test(userAgent)) {
      const match = userAgent.match(/iPhone OS (\d+_\d+)/);
      return match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
    }
    
    return 'Unknown';
  }

  static getMediaQueries() {
    const queries = {
      'max-width: 768px': window.matchMedia('(max-width: 768px)').matches,
      'max-width: 1024px': window.matchMedia('(max-width: 1024px)').matches,
      'min-width: 1200px': window.matchMedia('(min-width: 1200px)').matches,
      'prefers-dark-scheme': window.matchMedia('(prefers-color-scheme: dark)').matches,
      'prefers-reduced-motion': window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      'orientation: portrait': window.matchMedia('(orientation: portrait)').matches,
      'hover: hover': window.matchMedia('(hover: hover)').matches,
      'pointer: fine': window.matchMedia('(pointer: fine)').matches
    };
    
    return queries;
  }

  static getLastMousePosition() {
    return window.__lastMousePosition || { x: null, y: null, timestamp: null };
  }

  static getPageLifecycleState() {
    if ('document' in window && 'hidden' in document) {
      return document.hidden ? 'hidden' : 'visible';
    }
    return 'unknown';
  }

  static checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        return {
          available: true,
          vendor: gl.getParameter(gl.VENDOR),
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION)
        };
      }
    } catch (e) {
      // WebGL not available
    }
    
    return { available: false };
  }

  static isDevelopment() {
    return !!(
      window.location.hostname === 'localhost' ||
      window.location.hostname.startsWith('127.') ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname.includes('dev') ||
      window.location.hostname.includes('test') ||
      window.location.port !== ''
    );
  }

  static detectFrameworks() {
    const frameworks = {};
    
    // React
    frameworks.react = !!(
      window.React || 
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      document.querySelector('[data-reactroot]')
    );
    
    // Vue
    frameworks.vue = !!(
      window.Vue ||
      window.__VUE_DEVTOOLS_GLOBAL_HOOK__ ||
      document.querySelector('[data-v-]')
    );
    
    // Angular
    frameworks.angular = !!(
      window.angular ||
      window.ng ||
      document.querySelector('[ng-app]') ||
      document.querySelector('[ng-version]')
    );
    
    // jQuery
    frameworks.jquery = !!(window.jQuery || window.$);
    
    return frameworks;
  }

  static detectAdBlocker() {
    // Simple ad blocker detection
    try {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);
      
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      
      return isBlocked;
    } catch (e) {
      return false;
    }
  }

  static detectExtensions() {
    const extensions = {};
    
    // Chrome extensions (very limited detection)
    if (window.chrome && window.chrome.runtime) {
      extensions.chrome_extensions_api = true;
    }
    
    return extensions;
  }

  static detectAutomation() {
    return {
      webdriver: navigator.webdriver === true,
      phantom: window.callPhantom || window._phantom,
      selenium: window.__webdriver_script_fn || window.__selenium_unwrapped,
      headless_chrome: window.outerHeight === 0 && window.outerWidth === 0
    };
  }

  // Initialize error tracking
  static initializeErrorTracking() {
    if (!window.__widgetConsoleErrors) {
      window.__widgetConsoleErrors = [];
      window.__widgetJSErrors = [];
      window.__widgetUnhandledRejections = [];
      
      // Track console errors without printing to console
      const originalError = console.error;
      console.error = function(...args) {
        window.__widgetConsoleErrors.push({
          timestamp: new Date().toISOString(),
          message: args.join(' ')
        });
      };
      
      // Track JavaScript errors
      window.addEventListener('error', (event) => {
        window.__widgetJSErrors.push({
          timestamp: new Date().toISOString(),
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null
        });
      });
      
      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        window.__widgetUnhandledRejections.push({
          timestamp: new Date().toISOString(),
          reason: event.reason,
          promise: event.promise
        });
      });
      
      // Track mouse position
      document.addEventListener('mousemove', (event) => {
        window.__lastMousePosition = {
          x: event.clientX,
          y: event.clientY,
          timestamp: Date.now()
        };
      });
    }
  }
}

// Auto-initialize error tracking when loaded
MetadataCollector.initializeErrorTracking();