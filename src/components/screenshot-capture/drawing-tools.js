/**
 * Drawing Tools UI Component
 * Handles tool selection, color picker, and action buttons
 */

export default class DrawingTools {
  constructor(options = {}) {
    this.options = {
      container: null,
      onToolChange: null,
      onColorChange: null,
      onAction: null,
      ...options
    };

    this.currentTool = 'pen';
    this.currentColor = '#ef4444';
  }

  /**
   * Create the drawing tools UI
   */
  createUI() {
    if (!this.options.container) {
      throw new Error('Container is required for DrawingTools');
    }

    this.options.container.innerHTML = `
      <!-- Drawing Tools -->
      <div class="drawing-tools">
        <div class="tool-group">
          <span class="tool-label">Tools:</span>
          <button class="tool-btn active" data-tool="pen">✏️ Pen</button>
          <button class="tool-btn" data-tool="rectangle">⬜ Rectangle</button>
          <button class="tool-btn" data-tool="arrow">↗️ Arrow</button>
        </div>
        
        <div class="tool-group">
          <span class="tool-label">Color:</span>
          <div class="color-options">
            <div class="color-option active" data-color="#ef4444" style="background: #ef4444;"></div>
            <div class="color-option" data-color="#3b82f6" style="background: #3b82f6;"></div>
            <div class="color-option" data-color="#10b981" style="background: #10b981;"></div>
            <div class="color-option" data-color="#f59e0b" style="background: #f59e0b;"></div>
            <div class="color-option" data-color="#8b5cf6" style="background: #8b5cf6;"></div>
            <div class="color-option" data-color="#000000" style="background: #000000;"></div>
          </div>
        </div>
        
        <div class="tool-group">
          <button class="tool-btn" data-action="clear">🗑️ Clear</button>
          <button class="tool-btn" data-action="undo" title="Undo last annotation (Ctrl+Z)">↶ Undo</button>
          <button class="tool-btn" data-action="center" title="Center screenshot view">🎯 Center</button>
        </div>
        
        <div class="tool-group">
          <span class="tool-label">Zoom:</span>
          <button class="tool-btn" data-action="zoom-out" title="Zoom out (-)">🔍➖</button>
          <span id="zoomLevel" class="zoom-display">100%</span>
          <button class="tool-btn" data-action="zoom-in" title="Zoom in (+)">🔍➕</button>
          <button class="tool-btn" data-action="zoom-reset" title="Reset zoom (0)">🔍🏠</button>
        </div>
        
        <div class="tool-group">
          <span class="tool-label" style="color: #059669; font-weight: 600;">📐 1:1 Scale</span>
          <small style="color: #6b7280;">Scroll to navigate • Full resolution editing</small>
          <small id="dimensionsDisplay" style="color: #6b7280; margin-left: 10px;"></small>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for tools and actions
   */
  setupEventListeners() {
    // Tool selection
    this.options.container.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setTool(e.target.dataset.tool);
      });
    });

    // Color selection
    this.options.container.querySelectorAll('[data-color]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setColor(e.target.dataset.color);
      });
    });

    // Action buttons
    this.options.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleAction(action);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.handleAction('undo');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.handleAction('zoom-in');
      } else if (e.key === '-') {
        e.preventDefault();
        this.handleAction('zoom-out');
      } else if (e.key === '0') {
        e.preventDefault();
        this.handleAction('zoom-reset');
      }
    });
  }

  /**
   * Set the current drawing tool
   */
  setTool(tool) {
    this.currentTool = tool;
    
    // Update UI
    this.options.container.querySelectorAll('[data-tool]').forEach(btn => {
      btn.classList.remove('active');
    });
    this.options.container.querySelector(`[data-tool="${tool}"]`).classList.add('active');
    
    // Notify parent component
    if (this.options.onToolChange) {
      this.options.onToolChange(tool);
    }
  }

  /**
   * Set the current drawing color
   */
  setColor(color) {
    this.currentColor = color;
    
    // Update UI
    this.options.container.querySelectorAll('[data-color]').forEach(btn => {
      btn.classList.remove('active');
    });
    this.options.container.querySelector(`[data-color="${color}"]`).classList.add('active');
    
    // Notify parent component
    if (this.options.onColorChange) {
      this.options.onColorChange(color);
    }
  }

  /**
   * Handle action button clicks
   */
  handleAction(action) {
    if (this.options.onAction) {
      this.options.onAction(action);
    }
  }

  /**
   * Update zoom display
   */
  updateZoomDisplay(zoomLevel) {
    const display = this.options.container.querySelector('#zoomLevel');
    if (display) {
      display.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
  }

  /**
   * Update dimensions display
   */
  updateDimensionsDisplay(width, height) {
    const display = this.options.container.querySelector('#dimensionsDisplay');
    if (display) {
      display.textContent = `${width}×${height}px`;
    }
  }

  /**
   * Get current tool
   */
  getCurrentTool() {
    return this.currentTool;
  }

  /**
   * Get current color
   */
  getCurrentColor() {
    return this.currentColor;
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Event listeners are automatically removed when the DOM is cleared
    if (this.options.container) {
      this.options.container.innerHTML = '';
    }
  }
}