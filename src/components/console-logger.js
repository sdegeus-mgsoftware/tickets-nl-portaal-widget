/**
 * Console Logger Component
 * Captures console logs and network requests for debugging
 */

export default class ConsoleLogger {
  constructor(options = {}) {
    this.options = {
      maxConsoleLogs: 50,
      maxNetworkLogs: 30,
      onLogsCaptured: null,
      ...options
    };

    this.consoleLogs = [];
    this.networkLogs = [];
    this.originalConsole = {};
    this.isCapturing = false;
    this.networkInterceptors = [];

    this.init();
  }

  /**
   * Initialize the console logger
   */
  init() {
    this.startCapturing();
  }

  /**
   * Start capturing console logs and network requests
   */
  startCapturing() {
    if (this.isCapturing) return;

    this.isCapturing = true;
    this.interceptConsole();
    this.interceptNetworkRequests();
    this.interceptErrors();
  }

  /**
   * Stop capturing logs
   */
  stopCapturing() {
    if (!this.isCapturing) return;

    this.isCapturing = false;
    this.restoreConsole();
    this.restoreNetworkRequests();
    this.restoreErrorHandlers();
  }

  /**
   * Intercept console methods
   */
  interceptConsole() {
    const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];
    
    consoleMethods.forEach(method => {
      // Store original method
      this.originalConsole[method] = console[method];
      
      // Override with our interceptor
      console[method] = (...args) => {
        // Call original method first
        this.originalConsole[method].apply(console, args);
        
        // Capture the log
        this.captureConsoleLog(method, args);
      };
    });
  }

  /**
   * Capture console log entry
   */
  captureConsoleLog(level, args) {
    const logEntry = {
      level: level,
      message: args.map(arg => this.formatLogArgument(arg)).join(' '),
      timestamp: Date.now(),
      stack: this.getStackTrace()
    };

    this.consoleLogs.push(logEntry);
    
    // Keep only recent logs
    if (this.consoleLogs.length > this.options.maxConsoleLogs) {
      this.consoleLogs = this.consoleLogs.slice(-this.options.maxConsoleLogs);
    }
    
    // Trigger callback
    if (this.options.onLogsCaptured) {
      this.options.onLogsCaptured(this.consoleLogs);
    }
  }

  /**
   * Format log argument for storage
   */
  formatLogArgument(arg) {
    if (typeof arg === 'string') {
      return arg;
    } else if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (error) {
        return String(arg);
      }
    } else {
      return String(arg);
    }
  }

  /**
   * Get stack trace for log context
   */
  getStackTrace() {
    try {
      throw new Error();
    } catch (error) {
      return error.stack?.split('\n').slice(3, 6).join('\n') || '';
    }
  }

  /**
   * Intercept network requests
   */
  interceptNetworkRequests() {
    this.interceptFetch();
    this.interceptXHR();
  }

  /**
   * Intercept fetch requests
   */
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const [resource, config] = args;
      
      // Capture request payload
      let requestPayload = null;
      let requestHeaders = {};
      
      if (config) {
        // Capture request headers
        if (config.headers) {
          requestHeaders = config.headers instanceof Headers 
            ? Object.fromEntries(config.headers.entries())
            : config.headers;
        }
        
        // Capture request body/payload
        if (config.body) {
          try {
            if (typeof config.body === 'string') {
              requestPayload = config.body;
            } else if (config.body instanceof FormData) {
              requestPayload = 'FormData: ' + Array.from(config.body.entries()).map(([k, v]) => `${k}=${v}`).join(', ');
            } else if (config.body instanceof URLSearchParams) {
              requestPayload = config.body.toString();
            } else {
              requestPayload = config.body.toString();
            }
          } catch (e) {
            requestPayload = '[Unable to capture payload]';
          }
        }
      }
      
      try {
        const response = await originalFetch(...args);
        
        // Clone response to read body without consuming original
        const responseClone = response.clone();
        let responseData = null;
        
        try {
          // Try to read response as text
          const responseText = await responseClone.text();
          responseData = responseText;
          
          // If it looks like JSON, try to parse and format it
          if (responseText && (responseText.startsWith('{') || responseText.startsWith('['))) {
            try {
              const jsonData = JSON.parse(responseText);
              responseData = JSON.stringify(jsonData, null, 2);
            } catch (e) {
              // Keep as text if JSON parsing fails
            }
          }
        } catch (e) {
          responseData = '[Unable to read response]';
        }
        
        // Log successful request with payload and response data
        this.captureNetworkLog({
          method: config?.method || 'GET',
          url: typeof resource === 'string' ? resource : resource.url,
          status: response.status,
          statusText: response.statusText,
          duration: Date.now() - startTime,
          size: response.headers.get('content-length') || responseData?.length || 'unknown',
          type: 'fetch',
          headers: this.getResponseHeaders(response),
          requestHeaders: requestHeaders,
          requestPayload: requestPayload,
          responseData: responseData,
          timestamp: Date.now()
        });
        
        return response;
      } catch (error) {
        // Log failed request
        this.captureNetworkLog({
          method: config?.method || 'GET',
          url: typeof resource === 'string' ? resource : resource.url,
          status: 0,
          statusText: 'Network Error',
          duration: Date.now() - startTime,
          size: 0,
          type: 'fetch',
          requestHeaders: requestHeaders,
          requestPayload: requestPayload,
          error: error.message,
          timestamp: Date.now()
        });
        
        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  interceptXHR() {
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      let startTime;
      let requestData = {};
      let requestPayload = null;
      let requestHeaders = {};
      
      // Override open method
      const originalOpen = xhr.open;
      xhr.open = function(method, url, ...args) {
        requestData = { method, url };
        startTime = Date.now();
        return originalOpen.apply(this, [method, url, ...args]);
      };
      
      // Override setRequestHeader to capture headers
      const originalSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function(name, value) {
        requestHeaders[name] = value;
        return originalSetRequestHeader.apply(this, [name, value]);
      };
      
      // Override send method
      const originalSend = xhr.send;
      xhr.send = function(...args) {
        // Capture request payload
        if (args.length > 0 && args[0]) {
          try {
            if (typeof args[0] === 'string') {
              requestPayload = args[0];
            } else if (args[0] instanceof FormData) {
              requestPayload = 'FormData: ' + Array.from(args[0].entries()).map(([k, v]) => `${k}=${v}`).join(', ');
            } else if (args[0] instanceof URLSearchParams) {
              requestPayload = args[0].toString();
            } else {
              requestPayload = args[0].toString();
            }
          } catch (e) {
            requestPayload = '[Unable to capture payload]';
          }
        }
        
        // Set up event listeners
        xhr.addEventListener('loadend', () => {
          const duration = Date.now() - startTime;
          
          // Capture response data
          let responseData = null;
          try {
            if (xhr.responseText) {
              responseData = xhr.responseText;
              
              // Try to format JSON responses
              if (responseData.startsWith('{') || responseData.startsWith('[')) {
                try {
                  const jsonData = JSON.parse(responseData);
                  responseData = JSON.stringify(jsonData, null, 2);
                } catch (e) {
                  // Keep as text if JSON parsing fails
                }
              }
            }
          } catch (e) {
            responseData = '[Unable to read response]';
          }
          
          // Capture the network log
          const logEntry = {
            method: requestData.method || 'GET',
            url: requestData.url,
            status: xhr.status,
            statusText: xhr.statusText,
            duration: duration,
            size: xhr.responseText?.length || 0,
            type: 'xhr',
            headers: self.parseResponseHeaders(xhr.getAllResponseHeaders()),
            requestHeaders: requestHeaders,
            requestPayload: requestPayload,
            responseData: responseData,
            timestamp: Date.now()
          };
          
          // Add to network logs
          self.captureNetworkLog(logEntry);
        });
        
        return originalSend.apply(this, args);
      };
      
      return xhr;
    };
  }

  /**
   * Capture network log entry
   */
  captureNetworkLog(logEntry) {
    // Add curl command for replication
    logEntry.curlCommand = this.generateCurlCommand(logEntry);
    
    // Add fetch command for replication
    logEntry.fetchCommand = this.generateFetchCommand(logEntry);
    
    this.networkLogs.push(logEntry);
    
    // Keep only recent logs
    if (this.networkLogs.length > this.options.maxNetworkLogs) {
      this.networkLogs = this.networkLogs.slice(-this.options.maxNetworkLogs);
    }
  }

  /**
   * Generate curl command for network request
   */
  generateCurlCommand(logEntry) {
    let curl = `curl -X ${logEntry.method} '${logEntry.url}'`;
    
    if (logEntry.headers) {
      Object.entries(logEntry.headers).forEach(([key, value]) => {
        curl += ` -H '${key}: ${value}'`;
      });
    }
    
    return curl;
  }

  /**
   * Generate fetch command for network request
   */
  generateFetchCommand(logEntry) {
    const options = {
      method: logEntry.method
    };
    
    if (logEntry.headers) {
      options.headers = logEntry.headers;
    }
    
    return `fetch('${logEntry.url}', ${JSON.stringify(options, null, 2)})`;
  }

  /**
   * Get response headers from fetch response
   */
  getResponseHeaders(response) {
    const headers = {};
    
    if (response.headers) {
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }
    
    return headers;
  }

  /**
   * Parse response headers from XMLHttpRequest
   */
  parseResponseHeaders(headerString) {
    const headers = {};
    
    if (headerString) {
      headerString.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          headers[key.trim()] = value.trim();
        }
      });
    }
    
    return headers;
  }

  /**
   * Intercept unhandled errors
   */
  interceptErrors() {
    // Intercept unhandled errors
    window.addEventListener('error', (event) => {
      this.captureConsoleLog('error', [
        `Unhandled Error: ${event.message}`,
        `File: ${event.filename}`,
        `Line: ${event.lineno}`,
        `Column: ${event.colno}`,
        `Stack: ${event.error?.stack || 'N/A'}`
      ]);
    });
    
    // Intercept unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureConsoleLog('error', [
        `Unhandled Promise Rejection: ${event.reason}`,
        `Promise: ${event.promise}`
      ]);
    });
  }

  /**
   * Restore original console methods
   */
  restoreConsole() {
    Object.keys(this.originalConsole).forEach(method => {
      console[method] = this.originalConsole[method];
    });
  }

  /**
   * Restore original network request methods
   */
  restoreNetworkRequests() {
    // Note: In a real implementation, you would need to store and restore the original fetch and XMLHttpRequest
    // For now, we'll just note that they should be restored
    }

  /**
   * Restore original error handlers
   */
  restoreErrorHandlers() {
    // Remove event listeners
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  /**
   * Get all captured console logs
   */
  getLogs() {
    return [...this.consoleLogs];
  }

  /**
   * Get all captured network logs
   */
  getNetworkLogs() {
    return [...this.networkLogs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.consoleLogs = [];
    this.networkLogs = [];
  }

  /**
   * Clear console logs only
   */
  clearConsoleLogs() {
    this.consoleLogs = [];
  }

  /**
   * Clear network logs only
   */
  clearNetworkLogs() {
    this.networkLogs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return {
      consoleLogs: this.consoleLogs,
      networkLogs: this.networkLogs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Import logs from JSON
   */
  importLogs(logsData) {
    if (logsData.consoleLogs) {
      this.consoleLogs = logsData.consoleLogs;
    }
    
    if (logsData.networkLogs) {
      this.networkLogs = logsData.networkLogs;
    }
  }

  /**
   * Get logs summary
   */
  getSummary() {
    const errorLogs = this.consoleLogs.filter(log => log.level === 'error');
    const warningLogs = this.consoleLogs.filter(log => log.level === 'warn');
    const failedRequests = this.networkLogs.filter(log => log.status >= 400);
    
    return {
      totalConsoleLogs: this.consoleLogs.length,
      totalNetworkLogs: this.networkLogs.length,
      errorLogs: errorLogs.length,
      warningLogs: warningLogs.length,
      failedRequests: failedRequests.length,
      captureStartTime: this.isCapturing ? Date.now() : null
    };
  }

  /**
   * Search logs by text
   */
  searchLogs(query) {
    const consoleLogs = this.consoleLogs.filter(log => 
      log.message.toLowerCase().includes(query.toLowerCase())
    );
    
    const networkLogs = this.networkLogs.filter(log => 
      log.url.toLowerCase().includes(query.toLowerCase()) ||
      log.method.toLowerCase().includes(query.toLowerCase())
    );
    
    return { consoleLogs, networkLogs };
  }

  /**
   * Filter logs by level
   */
  filterLogsByLevel(level) {
    return this.consoleLogs.filter(log => log.level === level);
  }

  /**
   * Filter network logs by status
   */
  filterNetworkLogsByStatus(statusCode) {
    return this.networkLogs.filter(log => log.status === statusCode);
  }

  /**
   * Get logs within time range
   */
  getLogsInTimeRange(startTime, endTime) {
    const consoleLogs = this.consoleLogs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
    
    const networkLogs = this.networkLogs.filter(log => 
      log.timestamp >= startTime && log.timestamp <= endTime
    );
    
    return { consoleLogs, networkLogs };
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    this.stopCapturing();
    this.clearLogs();
    this.originalConsole = {};
    this.networkInterceptors = [];
  }
} 