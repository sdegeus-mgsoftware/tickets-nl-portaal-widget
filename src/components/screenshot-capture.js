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
    this.currentTool = 'pen';
    this.currentColor = '#ef4444';
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.currentPath = null; // For storing pen tool path points
    this.originalImageData = null;
    this.resizeTimeout = null;
    this.displayScale = 1; // Scale factor for canvas display vs internal resolution
    this.originalCanvasWidth = 0; // Original canvas width for scaling calculations
    this.originalCanvasHeight = 0; // Original canvas height for scaling calculations

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
          <button class="tool-btn" data-action="clear">🗑️ Clear</button>
          <button class="tool-btn" data-action="undo" title="Undo last annotation (Ctrl+Z)">↶ Undo</button>
          <button class="tool-btn" data-action="center" title="Center screenshot view">🎯 Center</button>
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

    // Action buttons
    this.options.container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'clear') {
          this.clearAnnotations();
        } else if (action === 'undo') {
          this.undoAnnotation();
        } else if (action === 'center') {
          this.centerCanvas();
        }
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

    // Window resize handler to recenter canvas
    window.addEventListener('resize', () => {
      if (this.canvas && this.originalImageData) {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.centerCanvas();
        }, 300);
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
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    console.log(`📸 ${timestamp()} [SCREENSHOT] ========== SCREENSHOT PROCESS STARTED ==========`);
    
    return new Promise((resolve, reject) => {
      // Import html2canvas dynamically
      if (typeof html2canvas === 'undefined') {
        console.log(`📸 ${timestamp()} [SCREENSHOT] html2canvas not loaded, importing from CDN...`);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => {
          console.log(`📸 ${timestamp()} [SCREENSHOT] html2canvas loaded successfully, starting capture...`);
          this.captureScreen(resolve, reject);
        };
        script.onerror = () => {
          console.error(`📸 ${timestamp()} [SCREENSHOT] Failed to load html2canvas from CDN`);
          reject(new Error('Failed to load html2canvas'));
        };
        document.head.appendChild(script);
      } else {
        console.log(`📸 ${timestamp()} [SCREENSHOT] html2canvas already available, starting capture...`);
        this.captureScreen(resolve, reject);
      }
    });
  }

  /**
   * Capture the screen using html2canvas
   */
  async captureScreen(resolve, reject) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    
    try {
      console.log(`📸 ${timestamp()} [CAPTURE] ========== SCREEN CAPTURE STARTED ==========`);
      
      // Hide any UI elements that shouldn't be in the screenshot
      console.log(`📸 ${timestamp()} [CAPTURE] Finding UI elements to hide...`);
      const modal = document.getElementById('visualFeedbackModal');
      const stopButton = document.getElementById('stopRecordingFloating');
      const screenshotLoader = document.getElementById('screenshotLoadingIndicator');
      const helpButton = document.querySelector('.help-button');
      
      console.log(`📸 ${timestamp()} [CAPTURE] UI elements found:`, {
        modal: !!modal,
        stopButton: !!stopButton,
        screenshotLoader: !!screenshotLoader,
        helpButton: !!helpButton
      });
      
      // Store the current state to restore later
      console.log(`📸 ${timestamp()} [CAPTURE] Storing original states...`);
      const modalCssText = modal ? modal.style.cssText : '';
      const stopButtonDisplay = stopButton ? stopButton.style.display : 'none';
      const loaderDisplay = screenshotLoader ? screenshotLoader.style.display : 'none';
      const helpButtonDisplay = helpButton ? helpButton.style.display : '';
      const modalWasVisible = modal && modal.style.display !== 'none';
      
      console.log(`📸 ${timestamp()} [CAPTURE] Original states:`, {
        modalWasVisible,
        stopButtonDisplay,
        loaderDisplay,
        helpButtonDisplay
      });
      
      // Hide elements
      console.log(`📸 ${timestamp()} [CAPTURE] Hiding UI elements...`);
      if (modal && modalWasVisible) {
        modal.style.display = 'none';
        console.log(`📸 ${timestamp()} [CAPTURE] Modal hidden`);
      }
      if (stopButton) {
        stopButton.style.display = 'none';
        console.log(`📸 ${timestamp()} [CAPTURE] Stop button hidden`);
      }
      if (screenshotLoader) {
        screenshotLoader.style.display = 'none';
        console.log(`📸 ${timestamp()} [CAPTURE] Screenshot loader hidden`);
      }
      if (helpButton) {
        helpButton.style.display = 'none';
        console.log(`📸 ${timestamp()} [CAPTURE] Help button hidden`);
      }
      
      // Wait longer for everything to settle and any animations to complete
      console.log(`📸 ${timestamp()} [CAPTURE] Waiting 250ms for layout to stabilize...`);
      const stabilizeStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 250));
      console.log(`📸 ${timestamp()} [CAPTURE] Layout stabilized (${Date.now() - stabilizeStart}ms)`);
      
      // Get current viewport information
      const currentScrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      console.log(`📸 ${timestamp()} [CAPTURE] Current viewport info:`, {
        scrollX: currentScrollX,
        scrollY: currentScrollY,
        width: viewportWidth,
        height: viewportHeight
      });
      
      console.log(`📸 ${timestamp()} [CAPTURE] Starting html2canvas capture of full page for cropping...`);
      const captureStart = Date.now();
      
      // First capture the full page
      const fullCanvas = await html2canvas(document.body, {
        useCORS: true,
        scale: 1,
        allowTaint: true,
        logging: false // Disable html2canvas logging for cleaner output
      });
      
      console.log(`📸 ${timestamp()} [CAPTURE] Full page captured: ${fullCanvas.width}×${fullCanvas.height}px`);
      
      // Now crop it to show only the current viewport
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = viewportWidth;
      croppedCanvas.height = viewportHeight;
      const ctx = croppedCanvas.getContext('2d');
      
      // Draw only the viewport area from the full screenshot
      ctx.drawImage(
        fullCanvas,
        currentScrollX, currentScrollY, viewportWidth, viewportHeight, // Source rectangle (current viewport)
        0, 0, viewportWidth, viewportHeight // Destination rectangle (full cropped canvas)
      );
      
      console.log(`📸 ${timestamp()} [CAPTURE] Viewport cropped from full page (${Date.now() - captureStart}ms)`);
      console.log(`📸 ${timestamp()} [CAPTURE] Cropped canvas dimensions: ${croppedCanvas.width}×${croppedCanvas.height}px`);
      console.log(`📸 ${timestamp()} [CAPTURE] Cropped from position: ${currentScrollX},${currentScrollY}`);
      
      // Use the cropped canvas instead of the full canvas
      const canvas = croppedCanvas;
      
      console.log(`📸 ${timestamp()} [CAPTURE] Restoring UI elements...`);
      
      // Restore all hidden elements
      if (modal && modalWasVisible) {
        if (modalCssText) {
          modal.style.cssText = modalCssText;
        } else {
          modal.style.display = 'flex';
        }
        console.log(`📸 ${timestamp()} [CAPTURE] Modal restored`);
      }
      if (stopButton) {
        stopButton.style.display = stopButtonDisplay;
        console.log(`📸 ${timestamp()} [CAPTURE] Stop button restored`);
      }
      if (screenshotLoader) {
        screenshotLoader.style.display = loaderDisplay;
        console.log(`📸 ${timestamp()} [CAPTURE] Screenshot loader restored`);
      }
      if (helpButton) {
        helpButton.style.display = helpButtonDisplay;
        console.log(`📸 ${timestamp()} [CAPTURE] Help button restored`);
      }
      
      console.log(`📸 ${timestamp()} [CAPTURE] Converting to PNG data URL...`);
      const pngStart = Date.now();
      this.originalScreenshot = canvas.toDataURL('image/png');
      console.log(`📸 ${timestamp()} [CAPTURE] PNG conversion complete (${Date.now() - pngStart}ms)`);
      console.log(`📸 ${timestamp()} [CAPTURE] Data URL length: ${this.originalScreenshot.length} chars`);
      
      console.log(`📸 ${timestamp()} [CAPTURE] Setting up canvas...`);
      this.setupCanvas(canvas);
      
      console.log(`📸 ${timestamp()} [CAPTURE] ========== SCREEN CAPTURE COMPLETE ==========`);
      resolve();
    } catch (error) {
      console.error(`📸 ${timestamp()} [CAPTURE] ❌ Error during screen capture:`, error);
      reject(error);
    }
  }

  /**
   * Setup the canvas with the screenshot
   */
  setupCanvas(screenshotCanvas) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    console.log(`📸 ${timestamp()} [SETUP] ========== CANVAS SETUP STARTED ==========`);
    
    const img = new Image();
    img.onload = () => {
      console.log(`📸 ${timestamp()} [SETUP] Image loaded for canvas setup`);
      console.log(`📸 ${timestamp()} [SETUP] Image natural dimensions: ${img.naturalWidth}×${img.naturalHeight}px`);
      
      // Set canvas internal size to match screenshot (for high quality)
      console.log(`📸 ${timestamp()} [SETUP] Setting canvas internal dimensions...`);
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      console.log(`📸 ${timestamp()} [SETUP] Canvas internal size set to: ${this.canvas.width}×${this.canvas.height}px`);
      
      // Store original dimensions for later scaling
      console.log(`📸 ${timestamp()} [SETUP] Storing original dimensions for later scaling...`);
      this.originalCanvasWidth = img.width;
      this.originalCanvasHeight = img.height;
      this.displayScale = 1; // Will be updated when container is ready
      
      // Draw the screenshot
      console.log(`📸 ${timestamp()} [SETUP] Drawing image to canvas...`);
      const drawStart = Date.now();
      this.ctx.drawImage(img, 0, 0);
      console.log(`📸 ${timestamp()} [SETUP] Image drawn to canvas (${Date.now() - drawStart}ms)`);
      
      // Store original image data
      console.log(`📸 ${timestamp()} [SETUP] Storing original image data...`);
      const imageDataStart = Date.now();
      this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      console.log(`📸 ${timestamp()} [SETUP] Original image data stored (${Date.now() - imageDataStart}ms)`);
      
      // Dimensions display will be updated in centerCanvas() after scaling is calculated
      console.log(`📸 ${timestamp()} [SETUP] Dimensions display will be updated after scaling...`);
      
      // Mark canvas as ready but DON'T center yet - container doesn't have final dimensions
      console.log(`📸 ${timestamp()} [SETUP] Canvas setup complete, marking as ready...`);
      this.canvasReady = true;
      
      // DON'T center here - container size is not final yet!
      console.log(`📸 ${timestamp()} [SETUP] Centering will happen later when modal layout is complete`);
      
      // Make canvas visible but without scaling yet
      if (this.canvas) {
        this.canvas.classList.add('canvas-ready');
        console.log(`📸 ${timestamp()} [SETUP] Canvas marked as ready (scaling will happen later)`);
      }
      
      console.log(`📸 ${timestamp()} [SETUP] ========== CANVAS SETUP COMPLETE ==========`);
    };
    
    console.log(`📸 ${timestamp()} [SETUP] Starting image load from data URL...`);
    img.src = this.originalScreenshot;
  }

  /**
   * Center the canvas when modal layout is stable (called externally)
   */
  centerCanvasWhenReady() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    console.log(`🎯 ${timestamp()} [CENTER] ========== CENTERING WHEN READY ==========`);
    
    if (!this.canvasReady) {
      console.log(`🎯 ${timestamp()} [CENTER] Canvas not ready yet, skipping centering`);
      return;
    }
    
    console.log(`🎯 ${timestamp()} [CENTER] Canvas is ready, modal layout stable, centering now...`);
    this.centerCanvas();
    
    // Make canvas visible now that it's properly positioned
    console.log(`🎯 ${timestamp()} [CENTER] Making canvas visible after proper positioning...`);
    if (this.canvas) {
      this.canvas.classList.add('canvas-ready');
      console.log(`🎯 ${timestamp()} [CENTER] Canvas marked as ready and visible`);
    }
    
    console.log(`🎯 ${timestamp()} [CENTER] ========== CENTERING WHEN READY COMPLETE ==========`);
  }

  /**
   * Scale and center the canvas within its container
   */
  centerCanvas() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    console.log(`🎯 ${timestamp()} [CENTER] ========== CANVAS SCALING & CENTERING STARTED ==========`);
    
    const container = this.options.container.querySelector('.screenshot-container');
    if (!container || !this.canvas) {
      console.log(`🎯 ${timestamp()} [CENTER] Missing required elements:`, { 
        container: !!container, 
        canvas: !!this.canvas 
      });
      return;
    }
    
    // Now that container is rendered, calculate proper scaling
    console.log(`🎯 ${timestamp()} [CENTER] Calculating display size to fit container...`);
    const containerRect = container.getBoundingClientRect();
    const containerStyle = window.getComputedStyle(container);
    
    console.log(`🎯 ${timestamp()} [CENTER] Container rect:`, {
      width: containerRect.width,
      height: containerRect.height,
      clientWidth: container.clientWidth,
      clientHeight: container.clientHeight
    });
    
    // Account for padding
    const paddingTop = parseInt(containerStyle.paddingTop) || 0;
    const paddingRight = parseInt(containerStyle.paddingRight) || 0;
    const paddingBottom = parseInt(containerStyle.paddingBottom) || 0;
    const paddingLeft = parseInt(containerStyle.paddingLeft) || 0;
    
    // Available space in container (leave some margin)
    const availableWidth = container.clientWidth - paddingLeft - paddingRight - 20; // 20px margin
    const availableHeight = container.clientHeight - paddingTop - paddingBottom - 20; // 20px margin
    
    console.log(`🎯 ${timestamp()} [CENTER] Available space: ${availableWidth}×${availableHeight}px`);
    console.log(`🎯 ${timestamp()} [CENTER] Canvas original size: ${this.originalCanvasWidth}×${this.originalCanvasHeight}px`);
    
    if (this.originalCanvasWidth && this.originalCanvasHeight && availableWidth > 0 && availableHeight > 0) {
      // Calculate scale to fit (maintain aspect ratio)
      const scaleX = availableWidth / this.originalCanvasWidth;
      const scaleY = availableHeight / this.originalCanvasHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      // Set display size
      const displayWidth = this.originalCanvasWidth * scale;
      const displayHeight = this.originalCanvasHeight * scale;
      
      console.log(`🎯 ${timestamp()} [CENTER] Scale factors: x=${scaleX.toFixed(3)}, y=${scaleY.toFixed(3)}, final=${scale.toFixed(3)}`);
      console.log(`🎯 ${timestamp()} [CENTER] Setting display size: ${displayWidth}×${displayHeight}px`);
      
      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
      
      // Store scale for coordinate calculations
      this.displayScale = scale;
      
      // Update dimensions display
      const dimensionsDisplay = this.options.container.querySelector('#dimensionsDisplay');
      if (dimensionsDisplay) {
        const scaleText = scale < 1 ? ` (${Math.round(scale * 100)}% scale)` : '';
        dimensionsDisplay.textContent = `${this.originalCanvasWidth}×${this.originalCanvasHeight}px${scaleText}`;
      }
      
      console.log(`🎯 ${timestamp()} [CENTER] Canvas scaled successfully! Scale factor: ${scale.toFixed(3)}`);
    } else {
      console.log(`🎯 ${timestamp()} [CENTER] Using original size - no scaling needed`);
      this.displayScale = 1;
    }
    
    // Center the canvas with CSS
    this.canvas.style.display = 'block';
    this.canvas.style.margin = 'auto';
    
    // Reset any scroll position since canvas should now fit
    container.scrollLeft = 0;
    container.scrollTop = 0;
    
    console.log(`🎯 ${timestamp()} [CENTER] Canvas centered and scroll reset`);
    console.log(`🎯 ${timestamp()} [CENTER] ========== CANVAS SCALING & CENTERING COMPLETE ==========`);
  }

  /**
   * Convert screen coordinates to canvas coordinates accounting for scaling
   */
  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Get the mouse position relative to the canvas display area
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    
    // Calculate the actual scale ratio between canvas internal size and display size
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    // Convert display coordinates to canvas coordinates
    const canvasX = displayX * scaleX;
    const canvasY = displayY * scaleY;
    
    // Debug coordinate conversion periodically for troubleshooting
    if (!this.coordsDebugLogged || Math.random() < 0.01) {
      console.log('🎯 [COORDS] Canvas coordinate conversion:', {
        canvasSize: { width: this.canvas.width, height: this.canvas.height },
        displaySize: { width: rect.width, height: rect.height },
        scaleFactors: { x: scaleX, y: scaleY },
        mouseDisplay: { x: displayX, y: displayY },
        mouseCanvas: { x: canvasX, y: canvasY }
      });
      this.coordsDebugLogged = true;
    }
    
    return { x: canvasX, y: canvasY };
  }

  /**
   * Start drawing on canvas
   */
  startDrawing(e) {
    this.isDrawing = true;
    const coords = this.getCanvasCoordinates(e);
    this.startX = coords.x;
    this.startY = coords.y;
    
    // For pen tool, initialize a path array
    if (this.currentTool === 'pen') {
      this.currentPath = [{ x: coords.x, y: coords.y }];
    }
  }

  /**
   * Draw on canvas
   */
  draw(e) {
    if (!this.isDrawing) return;

    const coords = this.getCanvasCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;

    // Clear canvas and redraw everything
    this.redrawCanvas();

    // Draw current annotation
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.currentTool === 'pen') {
      // For pen tool, add point to current path and draw smooth curve
      this.currentPath.push({ x: currentX, y: currentY });
      
      // Draw the complete path as a smooth curve
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
      
      for (let i = 1; i < this.currentPath.length; i++) {
        this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
      }
      this.ctx.stroke();
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
    
    // Save annotation based on tool type
    let annotation;
    
    if (this.currentTool === 'pen') {
      // For pen tool, save the complete path
      annotation = {
        type: this.currentTool,
        color: this.currentColor,
        path: [...this.currentPath], // Copy the path array
        timestamp: Date.now()
      };
    } else {
      // For other tools, save start/end coordinates
      const coords = this.getCanvasCoordinates(e);
      annotation = {
        type: this.currentTool,
        color: this.currentColor,
        startX: this.startX,
        startY: this.startY,
        endX: coords.x,
        endY: coords.y,
        timestamp: Date.now()
      };
    }
    
    this.annotations.push(annotation);
    
    // Clear current path
    this.currentPath = null;
    
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
    this.ctx.lineJoin = 'round';
    
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
      if (annotation.path && annotation.path.length > 0) {
        // Draw path-based pen annotation (new format)
        this.ctx.beginPath();
        this.ctx.moveTo(annotation.path[0].x, annotation.path[0].y);
        
        for (let i = 1; i < annotation.path.length; i++) {
          this.ctx.lineTo(annotation.path[i].x, annotation.path[i].y);
        }
        this.ctx.stroke();
      } else {
        // Legacy pen annotation format (fallback)
        this.ctx.beginPath();
        this.ctx.moveTo(annotation.startX, annotation.startY);
        this.ctx.lineTo(annotation.endX, annotation.endY);
        this.ctx.stroke();
      }
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
    this.canvasReady = false;
    
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Remove the ready class to hide canvas during reset
      this.canvas.classList.remove('canvas-ready');
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
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