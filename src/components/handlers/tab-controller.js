/**
 * Tab Controller
 * Manages tab switching and content display in the modal
 */

export default class TabController {
  constructor(modalElement, components) {
    this.modalElement = modalElement;
    this.components = components;
    this.cachedSystemInfo = null;
    
    this.setupTabSwitching();
  }

  /**
   * Setup tab switching functionality
   */
  setupTabSwitching() {
    const tabButtons = this.modalElement.querySelectorAll('.tab-btn');
    const tabPanels = this.modalElement.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');
        
        // Remove active class from all buttons and panels
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        
        // Add active class to clicked button and corresponding panel
        button.classList.add('active');
        const targetPanel = this.modalElement.querySelector(`#${targetTab}Tab`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        // Handle tab-specific initialization when switching
        this.handleTabSwitch(targetTab);
      });
    });
  }

  /**
   * Handle tab switch events
   */
  handleTabSwitch(tabName) {
    switch (tabName) {
      case 'system':
        this.displaySystemInfo();
        break;
      case 'console':
        this.displayConsoleLogs();
        break;
      case 'network':
        this.displayNetworkLogs();
        break;
      case 'steps':
        this.displayStepRecording();
        break;
      // Chat tab is handled by ChatInterface component
    }
  }

  /**
   * Set cached system info
   */
  setCachedSystemInfo(systemInfo) {
    this.cachedSystemInfo = systemInfo;
  }

  /**
   * Display system information in the system tab
   */
  displaySystemInfo() {
    const systemTab = this.modalElement.querySelector('#systemTab');
    if (!systemTab || !this.components.systemInfo) return;

    // Use the cached system info that was gathered during modal initialization
    const systemInfo = this.cachedSystemInfo || this.components.systemInfo.getData();
    if (!systemInfo) {
      systemTab.innerHTML = `
        <div class="system-info-content">
          <h4>💻 System Information</h4>
          <p>System information is still being gathered...</p>
        </div>
      `;
      return;
    }

    systemTab.innerHTML = `
      <div class="system-info-content">
        <h4>💻 System Information</h4>
        <div class="info-grid">
          <div class="info-item">
            <strong>🌐 Browser:</strong> ${systemInfo.browser || 'N/A'} ${systemInfo.browserVersion || ''}
          </div>
          <div class="info-item">
            <strong>💻 OS:</strong> ${systemInfo.os || 'N/A'} (${systemInfo.platform || 'N/A'})
          </div>
          <div class="info-item">
            <strong>📱 Display:</strong> ${systemInfo.viewportWidth || 'N/A'}×${systemInfo.viewportHeight || 'N/A'} @ ${systemInfo.devicePixelRatio || 'N/A'}x
          </div>
          <div class="info-item">
            <strong>🌍 Location:</strong> ${systemInfo.ip || 'N/A'} (${systemInfo.timezone || 'N/A'})
          </div>
          <div class="info-item">
            <strong>🗣️ Language:</strong> ${systemInfo.language || 'N/A'}
          </div>
          <div class="info-item">
            <strong>🔗 Connection:</strong> ${systemInfo.connectionType || 'N/A'}
          </div>
          <div class="info-item">
            <strong>📍 Page URL:</strong> ${systemInfo.url || 'N/A'}
          </div>
          <div class="info-item">
            <strong>⏰ Timestamp:</strong> ${systemInfo.timestamp ? new Date(systemInfo.timestamp).toLocaleString() : 'N/A'}
          </div>
          ${systemInfo.touchSupported ? `
          <div class="info-item">
            <strong>👆 Touch:</strong> Touch device detected
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Display console logs in the console tab
   */
  displayConsoleLogs() {
    const consoleTab = this.modalElement.querySelector('#consoleTab');
    if (!consoleTab) return;

    if (this.components.consoleLogger) {
      const consoleLogs = this.components.consoleLogger.getLogs();
      
      if (consoleLogs.length === 0) {
        consoleTab.innerHTML = `
          <div class="console-info">
            <h4>🖥️ Console Logs</h4>
            <div class="console-logs-container">
              <div class="console-empty-state">
                <span class="empty-message">Console was cleared or no messages have been logged yet.</span>
              </div>
            </div>
            <div class="log-actions">
              <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearConsoleLogs(); this.closest('.visual-feedback-modal').displayConsoleLogs();">🗑️ Clear Logs</button>
            </div>
          </div>
        `;
        return;
      }

      // Generate console logs HTML with browser-like styling
      const consoleLogsHtml = consoleLogs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        
        return `
          <div class="console-log-entry ${log.level}">
            <span class="log-message">${log.message}</span>
            ${log.stack ? `<div class="log-stack"><pre>${log.stack}</pre></div>` : ''}
          </div>
        `;
      }).join('');

      consoleTab.innerHTML = `
        <div class="console-info">
          <h4>🖥️ Console Logs (${consoleLogs.length})</h4>
          <div class="console-logs-container">
            ${consoleLogsHtml}
          </div>
          <div class="log-actions">
            <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearConsoleLogs(); this.closest('.visual-feedback-modal').displayConsoleLogs();">🗑️ Clear Logs</button>
          </div>
        </div>
      `;
    } else {
      consoleTab.innerHTML = `
        <div class="console-info">
          <h4>🖥️ Console Logs</h4>
          <p>Console logging is not enabled. Enable it in the widget configuration to see console logs here.</p>
        </div>
      `;
    }
  }

  /**
   * Display network logs in the network tab
   */
  displayNetworkLogs() {
    const networkTab = this.modalElement.querySelector('#networkTab');
    if (!networkTab) return;

    if (this.components.consoleLogger) {
      const networkLogs = this.components.consoleLogger.getNetworkLogs();
      
      if (networkLogs.length === 0) {
        networkTab.innerHTML = `
          <div class="network-info">
            <h4>🌐 Network Logs</h4>
            <p>No network requests captured yet. Network requests will appear here as they happen.</p>
            <small>Tip: Refresh the page or interact with the application to see network activity.</small>
          </div>
        `;
        return;
      }

      // Generate network logs HTML
      const networkLogsHtml = networkLogs.map((log, index) => {
        const statusClass = log.status >= 400 ? 'error' : log.status >= 300 ? 'warning' : 'success';
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        
        // Generate collapsible sections for headers, payload, and response
        const requestHeadersHtml = log.requestHeaders && Object.keys(log.requestHeaders).length > 0 ? `
          <div class="collapsible-section">
            <button class="collapsible-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              📤 Request Headers (${Object.keys(log.requestHeaders).length})
            </button>
            <div class="collapsible-content" style="display: none;">
              <pre>${JSON.stringify(log.requestHeaders, null, 2)}</pre>
            </div>
          </div>
        ` : '';

        const requestPayloadHtml = log.requestPayload ? `
          <div class="collapsible-section">
            <button class="collapsible-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              📦 Request Payload
            </button>
            <div class="collapsible-content" style="display: none;">
              <pre>${log.requestPayload}</pre>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${log.requestPayload.replace(/`/g, '\\`')}\`)">📋 Copy Payload</button>
            </div>
          </div>
        ` : '';

        const responseHeadersHtml = log.headers && Object.keys(log.headers).length > 0 ? `
          <div class="collapsible-section">
            <button class="collapsible-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              📥 Response Headers (${Object.keys(log.headers).length})
            </button>
            <div class="collapsible-content" style="display: none;">
              <pre>${JSON.stringify(log.headers, null, 2)}</pre>
            </div>
          </div>
        ` : '';

        const responseDataHtml = log.responseData ? `
          <div class="collapsible-section">
            <button class="collapsible-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              📄 Response Data
            </button>
            <div class="collapsible-content" style="display: none;">
              <pre>${log.responseData}</pre>
              <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${log.responseData.replace(/`/g, '\\`')}\`)">📋 Copy Response</button>
            </div>
          </div>
        ` : '';
        
        return `
          <div class="network-log-entry ${statusClass}">
            <div class="log-header">
              <span class="method ${log.method}">${log.method}</span>
              <span class="status status-${statusClass}">${log.status}</span>
              <span class="url">${log.url}</span>
              <span class="timestamp">${timestamp}</span>
            </div>
            <div class="log-details">
              <div class="detail-item">
                <strong>Duration:</strong> ${log.duration}ms
              </div>
              <div class="detail-item">
                <strong>Size:</strong> ${log.size} bytes
              </div>
              <div class="detail-item">
                <strong>Type:</strong> ${log.type}
              </div>
              ${log.error ? `<div class="detail-item error"><strong>Error:</strong> ${log.error}</div>` : ''}
            </div>
            
            ${requestHeadersHtml}
            ${requestPayloadHtml}
            ${responseHeadersHtml}
            ${responseDataHtml}
            
            ${log.curlCommand ? `
              <div class="collapsible-section">
                <button class="collapsible-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                  💻 cURL Command
                </button>
                <div class="collapsible-content" style="display: none;">
                  <button class="copy-btn" onclick="navigator.clipboard.writeText('${log.curlCommand}')">📋 Copy cURL</button>
                  <pre><code>${log.curlCommand}</code></pre>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      networkTab.innerHTML = `
        <div class="network-info">
          <h4>🌐 Network Logs (${networkLogs.length})</h4>
          <div class="network-logs-container">
            ${networkLogsHtml}
          </div>
          <div class="log-actions">
            <button class="clear-logs-btn" onclick="if(this.closest('.visual-feedback-modal').components?.consoleLogger) this.closest('.visual-feedback-modal').components.consoleLogger.clearNetworkLogs(); this.closest('.visual-feedback-modal').displayNetworkLogs();">🗑️ Clear Logs</button>
          </div>
        </div>
      `;
    } else {
      networkTab.innerHTML = `
        <div class="network-info">
          <h4>🌐 Network Logs</h4>
          <p>Network logging is not enabled. Enable console/network logging in the widget configuration to see network requests here.</p>
        </div>
      `;
    }
  }

  /**
   * Display step recording interface in the steps tab
   */
  displayStepRecording() {
    const stepsTab = this.modalElement.querySelector('#stepsTab');
    if (!stepsTab || !this.components.stepReplication) return;

    // StepReplication component will render its own content when initialized
    // We just need to ensure it has the right container
    this.components.stepReplication.setContainer(stepsTab);
  }
}