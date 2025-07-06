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
      console.error('Error gathering system info:', error);
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
      console.log('Could not fetch IP address:', error);
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
   */
  parseBrowserInfo(userAgent) {
    const browsers = [
      { name: 'Chrome', regex: /Chrome\/(\d+\.\d+)/ },
      { name: 'Firefox', regex: /Firefox\/(\d+\.\d+)/ },
      { name: 'Safari', regex: /Version\/(\d+\.\d+).*Safari/ },
      { name: 'Edge', regex: /Edge\/(\d+\.\d+)/ },
      { name: 'Opera', regex: /Opera\/(\d+\.\d+)/ },
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
        console.log('Could not get storage estimate:', error);
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