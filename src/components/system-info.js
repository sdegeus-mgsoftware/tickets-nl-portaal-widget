/**
 * System Info Component
 * Gathers comprehensive browser and system information
 */

export default class SystemInfo {
  constructor(options = {}) {
    this.options = {
      enableConsoleLogging: true,
      enableNetworkLogging: true,
      ...options
    };

    this.systemData = null;
    this.networkLogs = [];
    this.isGathering = false;
  }

  /**
   * Gather all system information
   */
  async gather() {
    if (this.isGathering) return this.systemData;
    
    this.isGathering = true;
    
    try {
      // Get all system info in parallel
      const [
        browserInfo,
        deviceInfo,
        networkInfo,
        locationInfo,
        performanceInfo,
        hardwareInfo
      ] = await Promise.all([
        this.getBrowserInfo(),
        this.getDeviceInfo(),
        this.getNetworkInfo(),
        this.getLocationInfo(),
        this.getPerformanceInfo(),
        this.getHardwareInfo()
      ]);

      this.systemData = {
        // Browser information
        ...browserInfo,
        
        // Device information
        ...deviceInfo,
        
        // Network information
        ...networkInfo,
        
        // Location information
        ...locationInfo,
        
        // Performance information
        ...performanceInfo,
        
        // Hardware information
        ...hardwareInfo,
        
        // Page information
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        
        // Network logs if enabled
        networkLogs: this.options.enableNetworkLogging ? this.networkLogs : []
      };

      return this.systemData;
    } catch (error) {
      return this.getBasicSystemInfo();
    } finally {
      this.isGathering = false;
    }
  }

  /**
   * Get browser information
   */
  async getBrowserInfo() {
    const navigator = window.navigator;
    
    // Parse user agent
    const userAgent = navigator.userAgent;
    const browserData = this.parseBrowserInfo(userAgent);
    
    return {
      browser: browserData.browser,
      browserVersion: browserData.version,
      userAgent: userAgent,
      language: navigator.language,
      languages: navigator.languages,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      onLine: navigator.onLine,
      platform: navigator.platform,
      vendor: navigator.vendor,
      vendorSub: navigator.vendorSub,
      product: navigator.product,
      productSub: navigator.productSub
    };
  }

  /**
   * Get device information
   */
  async getDeviceInfo() {
    const screen = window.screen;
    
    return {
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      orientation: screen.orientation ? screen.orientation.type : 'unknown',
      touchSupported: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      pointerEvents: window.PointerEvent ? true : false
    };
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    // Get IP address
    let ip = 'Unknown';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ip = ipData.ip;
    } catch (error) {
    }
    
    return {
      ip: ip,
      connectionType: connection ? connection.effectiveType : 'unknown',
      downlink: connection ? connection.downlink : null,
      rtt: connection ? connection.rtt : null,
      saveData: connection ? connection.saveData : null,
      connectionNetworkType: connection ? connection.type : 'unknown'
    };
  }

  /**
   * Get location information
   */
  async getLocationInfo() {
    const now = new Date();
    
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      dateFormat: Intl.DateTimeFormat().resolvedOptions(),
      numberFormat: Intl.NumberFormat().resolvedOptions()
    };
  }

  /**
   * Get performance information
   */
  async getPerformanceInfo() {
    const performance = window.performance;
    
    if (!performance) {
      return {
        performanceSupported: false
      };
    }
    
    const navigation = performance.getEntriesByType('navigation')[0];
    const memory = performance.memory;
    
    return {
      performanceSupported: true,
      loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : null,
      domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : null,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      memoryUsed: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : null,
      memoryTotal: memory ? Math.round(memory.totalJSHeapSize / 1024 / 1024) : null,
      memoryLimit: memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : null
    };
  }

  /**
   * Get hardware information
   */
  async getHardwareInfo() {
    const navigator = window.navigator;
    
    return {
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      webGL: this.getWebGLInfo(),
      storage: await this.getStorageInfo(),
      webAssembly: typeof WebAssembly !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      geolocation: 'geolocation' in navigator,
      camera: await this.getCameraInfo(),
      battery: await this.getBatteryInfo()
    };
  }

  /**
   * Parse browser information from user agent
   * Uses comprehensive detection including modern browser patterns
   */
  parseBrowserInfo(userAgent) {
    // Detect Brave first using multiple methods
    if (this.isBrave(userAgent)) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
      return {
        browser: 'Brave',
        version: chromeMatch ? chromeMatch[1] : 'Unknown'
      };
    }

    // Browser detection patterns (order matters - most specific first)
    const browsers = [
      // Microsoft Edge (modern Chromium-based version uses Edg/)
      { name: 'Edge', regex: /Edg\/(\d+\.\d+)/ },
      
      // Microsoft Edge (legacy EdgeHTML version)
      { name: 'Edge Legacy', regex: /Edge\/(\d+\.\d+)/ },
      
      // Opera (modern versions use OPR/)
      { name: 'Opera', regex: /OPR\/(\d+\.\d+)/ },
      
      // Opera (older versions)
      { name: 'Opera', regex: /Opera\/(\d+\.\d+)/ },
      
      // Vivaldi Browser (Chromium-based)
      { name: 'Vivaldi', regex: /Vivaldi\/(\d+\.\d+)/ },
      
      // Samsung Internet Browser
      { name: 'Samsung Internet', regex: /SamsungBrowser\/(\d+\.\d+)/ },
      
      // UC Browser
      { name: 'UC Browser', regex: /UCBrowser\/(\d+\.\d+)/ },
      
      // Yandex Browser
      { name: 'Yandex', regex: /YaBrowser\/(\d+\.\d+)/ },
      
      // Firefox
      { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
      
      // Safari (check before Chrome since some Safari UAs contain Chrome)
      { name: 'Safari', regex: /Version\/(\d+\.\d+).*Safari/ },
      
      // Chrome (should be last among Chromium browsers)
      { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
      
      // Internet Explorer 11
      { name: 'Internet Explorer', regex: /Trident\/.*rv:(\d+\.\d+)/ },
      
      // Older Internet Explorer
      { name: 'Internet Explorer', regex: /MSIE (\d+\.\d+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.regex);
      if (match) {
        return {
          browser: browser.name,
          version: match[1]
        };
      }
    }

    return {
      browser: 'Unknown',
      version: 'Unknown'
    };
  }

  /**
   * Detect Brave browser using multiple methods
   */
  isBrave(userAgent) {
    // Method 1: Check for navigator.brave API (most reliable when available)
    if (typeof navigator !== 'undefined' && navigator.brave) {
      try {
        // Some versions have isBrave as a method, others as a property
        if (typeof navigator.brave.isBrave === 'function') {
          return navigator.brave.isBrave();
        } else if (navigator.brave.isBrave === true) {
          return true;
        }
      } catch (e) {
        // Ignore errors and continue with other detection methods
      }
    }
    
    // Method 2: Check for explicit Brave in user agent
    if (userAgent.includes('Brave') || userAgent.includes('brave')) {
      return true;
    }
    
    // Method 3: Check for Brave's specific user agent pattern
    // Brave often modifies the Chrome user agent in subtle ways
    if (userAgent.includes('Chrome') && userAgent.includes('Safari')) {
      // Check if it's missing some Chrome-specific markers that Brave removes
      if (!userAgent.includes('Google') && typeof navigator !== 'undefined' && navigator.vendor === 'Google Inc.') {
        // Additional checks to avoid false positives
        if (!userAgent.includes('OPR') && !userAgent.includes('Edg') && !userAgent.includes('Vivaldi')) {
          // This might be Brave, but we need stronger evidence
          // Check for absence of Chrome's typical branding
          if (!userAgent.includes('Chrome/') || userAgent.includes('HeadlessChrome')) {
            return false; // Likely headless Chrome or other variant
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Get operating system information
   */
  getOperatingSystem(userAgent) {
    const systems = [
      { name: 'Windows', regex: /Windows NT (\d+\.\d+)/ },
      { name: 'macOS', regex: /Mac OS X (\d+[._]\d+)/ },
      { name: 'Linux', regex: /Linux/ },
      { name: 'Android', regex: /Android (\d+\.\d+)/ },
      { name: 'iOS', regex: /OS (\d+_\d+)/ }
    ];

    for (const system of systems) {
      const match = userAgent.match(system.regex);
      if (match) {
        return {
          os: system.name,
          version: match[1] ? match[1].replace(/_/g, '.') : 'Unknown'
        };
      }
    }

    return {
      os: 'Unknown',
      version: 'Unknown'
    };
  }

  /**
   * Get first paint timing
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? Math.round(firstPaint.startTime) : null;
  }

  /**
   * Get first contentful paint timing
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : null;
  }

  /**
   * Get WebGL information
   */
  getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        return { supported: false };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      
      return {
        supported: true,
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION)
      };
    } catch (error) {
      return { supported: false, error: error.message };
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    const info = {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webSQL: typeof openDatabase !== 'undefined',
      quota: null,
      usage: null
    };

    // Get storage quota if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        info.quota = estimate.quota;
        info.usage = estimate.usage;
      } catch (error) {
      }
    }

    return info;
  }

  /**
   * Get camera information
   */
  async getCameraInfo() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { supported: false };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      return {
        supported: true,
        count: cameras.length,
        devices: cameras.map(camera => ({
          id: camera.deviceId,
          label: camera.label || 'Unknown Camera'
        }))
      };
    } catch (error) {
      return { supported: false, error: error.message };
    }
  }

  /**
   * Get battery information
   */
  async getBatteryInfo() {
    if (!navigator.getBattery) {
      return { supported: false };
    }

    try {
      const battery = await navigator.getBattery();
      
      return {
        supported: true,
        charging: battery.charging,
        level: Math.round(battery.level * 100),
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (error) {
      return { supported: false, error: error.message };
    }
  }

  /**
   * Get basic system info as fallback
   */
  getBasicSystemInfo() {
    const userAgent = navigator.userAgent;
    const browserInfo = this.parseBrowserInfo(userAgent);
    const osInfo = this.getOperatingSystem(userAgent);
    
    return {
      browser: browserInfo.browser,
      browserVersion: browserInfo.version,
      os: osInfo.os,
      osVersion: osInfo.version,
      platform: navigator.platform,
      language: navigator.language,
      userAgent: userAgent,
      screenWidth: screen.width,
      screenHeight: screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      touchSupported: 'ontouchstart' in window,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      networkLogs: []
    };
  }

  /**
   * Get the gathered system data
   */
  getData() {
    return this.systemData;
  }

  /**
   * Add network log entry
   */
  addNetworkLog(logEntry) {
    if (!this.options.enableNetworkLogging) return;
    
    this.networkLogs.push(logEntry);
    
    // Keep only last 30 entries
    if (this.networkLogs.length > 30) {
      this.networkLogs = this.networkLogs.slice(-30);
    }
  }

  /**
   * Get network logs
   */
  getNetworkLogs() {
    return [...this.networkLogs];
  }

  /**
   * Clear network logs
   */
  clearNetworkLogs() {
    this.networkLogs = [];
  }

  /**
   * Export system info as JSON
   */
  exportAsJSON() {
    return JSON.stringify(this.systemData, null, 2);
  }

  /**
   * Reset the component
   */
  reset() {
    this.systemData = null;
    this.networkLogs = [];
    this.isGathering = false;
  }
} 