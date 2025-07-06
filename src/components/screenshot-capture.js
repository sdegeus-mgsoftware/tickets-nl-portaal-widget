/**
 * Screenshot Capture Component
 * Handles screenshot taking, canvas drawing, and annotation management
 */

export default class ScreenshotCapture {
  constructor(options = {}) {
    this.options = {
      container: null,
      onAnnotationChange: null,
      ...options
    };

    this.canvas = null;
    this.ctx = null;
    this.originalScreenshot = '';
    this.annotations = [];
    this.currentTool = 'rectangle';
    this.currentColor = '#ef4444';
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.originalImageData = null;

    this.init();
  }

  /**
   * Initialize the screenshot capture component
   */
  init() {
    this.createElements();
    this.setupEventListeners();
  }

  /**
   * Create the drawing tools and canvas elements
   */
  createElements() {
    if (!this.options.container) {
      throw new Error('Container is required for ScreenshotCapture');
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
          <button class="tool-btn" onclick="this.clearAnnotations()">🗑️ Clear</button>
          <button class="tool-btn" onclick="this.undoAnnotation()" title="Undo last annotation (Ctrl+Z)">↶ Undo</button>
        </div>
        
        <div class="tool-group">
          <span class="tool-label" style="color: #059669; font-weight: 600;">📐 1:1 Scale</span>
          <small style="color: #6b7280;">Scroll to navigate • Full resolution editing</small>
          <small id="dimensionsDisplay" style="color: #6b7280; margin-left: 10px;"></small>
        </div>
      </div>
      
      <div class="screenshot-container">
        <canvas id="screenshotCanvas"></canvas>
      </div>
    `;

    this.canvas = this.options.container.querySelector('#screenshotCanvas');
    this.ctx = this.canvas.getContext('2d');
  }

  /**
   * Setup event listeners for drawing tools and canvas
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

    // Canvas drawing events
    this.setupDrawingEvents();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undoAnnotation();
      }
    });
  }

  /**
   * Setup canvas drawing event listeners
   */
  setupDrawingEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouch.bind(this));
  }

  /**
   * Set the current drawing tool
   */
  setTool(tool) {
    this.currentTool = tool;
    
    // Update active tool button
    this.options.container.querySelectorAll('[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
  }

  /**
   * Set the current drawing color
   */
  setColor(color) {
    this.currentColor = color;
    
    // Update active color button
    this.options.container.querySelectorAll('[data-color]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  /**
   * Take a screenshot of the page
   */
  async takeScreenshot() {
    return new Promise((resolve, reject) => {
      // Import html2canvas dynamically
      if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => this.captureScreen(resolve, reject);
        script.onerror = () => reject(new Error('Failed to load html2canvas'));
        document.head.appendChild(script);
      } else {
        this.captureScreen(resolve, reject);
      }
    });
  }

  /**
   * Capture the screen using html2canvas
   */
  async captureScreen(resolve, reject) {
    try {
      // Hide the modal temporarily for screenshot
      const modal = document.getElementById('visualFeedbackModal');
      const stopButton = document.getElementById('stopRecordingFloating');
      
      const modalDisplay = modal ? modal.style.display : 'none';
      const stopButtonDisplay = stopButton ? stopButton.style.display : 'none';
      
      if (modal) modal.style.display = 'none';
      if (stopButton) stopButton.style.display = 'none';
      
      // Wait a moment for elements to hide
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 1,
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Restore modal visibility
      if (modal) modal.style.display = modalDisplay;
      if (stopButton) stopButton.style.display = stopButtonDisplay;
      
      this.originalScreenshot = canvas.toDataURL('image/png');
      this.setupCanvas(canvas);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Setup the canvas with the screenshot
   */
  setupCanvas(screenshotCanvas) {
    const img = new Image();
    img.onload = () => {
      // Set canvas size to match screenshot
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      
      // Draw the screenshot
      this.ctx.drawImage(img, 0, 0);
      
      // Store original image data
      this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Update dimensions display
      const dimensionsDisplay = this.options.container.querySelector('#dimensionsDisplay');
      if (dimensionsDisplay) {
        dimensionsDisplay.textContent = `${img.width}×${img.height}px`;
      }
    };
    img.src = this.originalScreenshot;
  }

  /**
   * Start drawing on canvas
   */
  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
  }

  /**
   * Draw on canvas
   */
  draw(e) {
    if (!this.isDrawing) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Clear canvas and redraw everything
    this.redrawCanvas();

    // Draw current annotation
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    if (this.currentTool === 'pen') {
      // For pen tool, draw a line from last position to current
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();
      
      // Update start position for continuous drawing
      this.startX = currentX;
      this.startY = currentY;
    } else if (this.currentTool === 'rectangle') {
      // Draw rectangle
      this.ctx.strokeRect(
        this.startX,
        this.startY,
        currentX - this.startX,
        currentY - this.startY
      );
    } else if (this.currentTool === 'arrow') {
      // Draw arrow
      this.drawArrow(this.startX, this.startY, currentX, currentY);
    }
  }

  /**
   * Stop drawing and save annotation
   */
  stopDrawing(e) {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    
    // Save annotation
    const annotation = {
      type: this.currentTool,
      color: this.currentColor,
      startX: this.startX,
      startY: this.startY,
      endX: endX,
      endY: endY,
      timestamp: Date.now()
    };
    
    this.annotations.push(annotation);
    
    // Trigger callback
    if (this.options.onAnnotationChange) {
      this.options.onAnnotationChange(this.annotations);
    }
  }

  /**
   * Handle touch events for mobile devices
   */
  handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0] || e.changedTouches[0];
    const mouseEvent = new MouseEvent(
      e.type === 'touchstart' ? 'mousedown' : 
      e.type === 'touchmove' ? 'mousemove' : 'mouseup',
      {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
    );
    this.canvas.dispatchEvent(mouseEvent);
  }

  /**
   * Redraw the canvas with all annotations
   */
  redrawCanvas() {
    if (!this.originalImageData) return;
    
    // Clear canvas and restore original image
    this.ctx.putImageData(this.originalImageData, 0, 0);
    
    // Redraw all annotations
    this.annotations.forEach(annotation => {
      this.drawAnnotation(annotation);
    });
  }

  /**
   * Draw a specific annotation
   */
  drawAnnotation(annotation) {
    this.ctx.strokeStyle = annotation.color;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    
    if (annotation.type === 'rectangle') {
      this.ctx.strokeRect(
        annotation.startX,
        annotation.startY,
        annotation.endX - annotation.startX,
        annotation.endY - annotation.startY
      );
    } else if (annotation.type === 'arrow') {
      this.drawArrow(annotation.startX, annotation.startY, annotation.endX, annotation.endY);
    } else if (annotation.type === 'pen') {
      this.ctx.beginPath();
      this.ctx.moveTo(annotation.startX, annotation.startY);
      this.ctx.lineTo(annotation.endX, annotation.endY);
      this.ctx.stroke();
    }
  }

  /**
   * Draw an arrow from start to end point
   */
  drawArrow(startX, startY, endX, endY) {
    const headLength = 15;
    const angle = Math.atan2(endY - startY, endX - startX);
    
    // Draw line
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    
    // Draw arrowhead
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle - Math.PI / 6),
      endY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - headLength * Math.cos(angle + Math.PI / 6),
      endY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  /**
   * Clear all annotations
   */
  clearAnnotations() {
    this.annotations = [];
    this.redrawCanvas();
    
    if (this.options.onAnnotationChange) {
      this.options.onAnnotationChange(this.annotations);
    }
  }

  /**
   * Undo last annotation
   */
  undoAnnotation() {
    if (this.annotations.length > 0) {
      this.annotations.pop();
      this.redrawCanvas();
      
      if (this.options.onAnnotationChange) {
        this.options.onAnnotationChange(this.annotations);
      }
    }
  }

  /**
   * Get the current screenshot data with annotations
   */
  getScreenshotData() {
    if (!this.canvas) return null;
    return this.canvas.toDataURL('image/png');
  }

  /**
   * Get all annotations
   */
  getAnnotations() {
    return [...this.annotations];
  }

  /**
   * Reset the component
   */
  reset() {
    this.annotations = [];
    this.originalScreenshot = '';
    this.originalImageData = null;
    
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    
    // Clear canvas
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Reset state
    this.reset();
  }
} 