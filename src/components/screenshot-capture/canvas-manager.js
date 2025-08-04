/**
 * Canvas Manager
 * Handles canvas setup, scaling, centering, and image data management
 */

export default class CanvasManager {
  constructor(options = {}) {
    this.options = {
      canvas: null,
      container: null,
      onReady: null,
      ...options
    };

    this.canvas = this.options.canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.container = this.options.container;

    // Canvas state
    this.originalImageData = null;
    this.originalScreenshot = '';
    this.canvasReady = false;
    this.displayScale = 1;
    this.originalCanvasWidth = 0;
    this.originalCanvasHeight = 0;
    this.resizeTimeout = null;

    this.setupResizeHandler();
  }

  /**
   * Setup window resize handler
   */
  setupResizeHandler() {
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
   * Create canvas element in container
   */
  createCanvas() {
    if (!this.container) {
      throw new Error('Container is required for CanvasManager');
    }

    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'screenshot-container';
    canvasContainer.innerHTML = '<canvas id="screenshotCanvas"></canvas>';
    
    this.container.appendChild(canvasContainer);
    
    this.canvas = canvasContainer.querySelector('#screenshotCanvas');
    this.ctx = this.canvas.getContext('2d');

    return this.canvas;
  }

  /**
   * Setup the canvas with a screenshot
   */
  setupCanvas(screenshotCanvas, screenshotDataUrl) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available for setup');
    }

    // Store the screenshot data URL
    this.originalScreenshot = screenshotDataUrl;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {


        
        // Set canvas internal size to match screenshot (for high quality)

        this.canvas.width = img.width;
        this.canvas.height = img.height;

        
        // Store original dimensions for later scaling

        this.originalCanvasWidth = img.width;
        this.originalCanvasHeight = img.height;
        this.displayScale = 1; // Will be updated when container is ready
        
        // Draw the screenshot

        const drawStart = Date.now();
        this.ctx.drawImage(img, 0, 0);

        
        // Store original image data

        const imageDataStart = Date.now();
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        
        // Mark canvas as ready

        this.canvasReady = true;
        
        // Make canvas visible but without scaling yet
        if (this.canvas) {
          this.canvas.classList.add('canvas-ready');

        }

        
        if (this.options.onReady) {
          this.options.onReady();
        }
        
        resolve({
          width: this.canvas.width,
          height: this.canvas.height,
          displayScale: this.displayScale
        });
      };
      
      img.onerror = () => {

        reject(new Error('Failed to load image for canvas setup'));
      };

      img.src = screenshotDataUrl;
    });
  }

  /**
   * Center the canvas when modal layout is stable (called externally)
   */
  centerCanvasWhenReady() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    
    if (!this.canvasReady) {

      return;
    }

    this.centerCanvas();
    
    // Make canvas visible now that it's properly positioned

    if (this.canvas) {
      this.canvas.classList.add('canvas-ready');

    }

  }

  /**
   * Scale and center the canvas within its container
   */
  centerCanvas() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    
    const containerElement = this.container.querySelector('.screenshot-container');
    if (!containerElement || !this.canvas) {
      return;
    }
    
    // Now that container is rendered, calculate proper scaling

    const containerRect = containerElement.getBoundingClientRect();
    const containerStyle = window.getComputedStyle(containerElement);
    
    // Account for padding
    const paddingTop = parseInt(containerStyle.paddingTop) || 0;
    const paddingRight = parseInt(containerStyle.paddingRight) || 0;
    const paddingBottom = parseInt(containerStyle.paddingBottom) || 0;
    const paddingLeft = parseInt(containerStyle.paddingLeft) || 0;
    
    // Available space in container (leave some margin)
    const availableWidth = containerElement.clientWidth - paddingLeft - paddingRight - 20; // 20px margin
    const availableHeight = containerElement.clientHeight - paddingTop - paddingBottom - 20; // 20px margin


    
    if (this.originalCanvasWidth && this.originalCanvasHeight && availableWidth > 0 && availableHeight > 0) {
      // Calculate scale to fit (maintain aspect ratio)
      const scaleX = availableWidth / this.originalCanvasWidth;
      const scaleY = availableHeight / this.originalCanvasHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      // Set display size
      const displayWidth = this.originalCanvasWidth * scale;
      const displayHeight = this.originalCanvasHeight * scale;


      
      this.canvas.style.width = `${displayWidth}px`;
      this.canvas.style.height = `${displayHeight}px`;
      
      // Store scale for coordinate calculations
      this.displayScale = scale;

    } else {

      this.displayScale = 1;
    }
    
    // Center the canvas with CSS
    this.canvas.style.display = 'block';
    this.canvas.style.margin = 'auto';
    
    // Reset any scroll position since canvas should now fit
    containerElement.scrollLeft = 0;
    containerElement.scrollTop = 0;



    return {
      displayScale: this.displayScale,
      displayWidth: this.canvas.style.width,
      displayHeight: this.canvas.style.height
    };
  }

  /**
   * Redraw the canvas with original image and annotations
   */
  redrawCanvas(annotations = [], drawAnnotationCallback = null) {
    if (!this.originalImageData) return;
    
    // Clear canvas and restore original image
    this.ctx.putImageData(this.originalImageData, 0, 0);
    
    // Redraw all annotations using the provided callback
    if (annotations.length > 0 && drawAnnotationCallback) {
      annotations.forEach(annotation => {
        drawAnnotationCallback(annotation);
      });
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
   * Get canvas dimensions and properties
   */
  getCanvasInfo() {
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      width: this.canvas ? this.canvas.width : 0,
      height: this.canvas ? this.canvas.height : 0,
      originalWidth: this.originalCanvasWidth,
      originalHeight: this.originalCanvasHeight,
      displayScale: this.displayScale,
      isReady: this.canvasReady
    };
  }

  /**
   * Update dimensions display in UI
   */
  updateDimensionsDisplay() {
    if (this.container) {
      const dimensionsDisplay = this.container.querySelector('#dimensionsDisplay');
      if (dimensionsDisplay) {
        const scaleText = this.displayScale < 1 ? ` (${Math.round(this.displayScale * 100)}% scale)` : '';
        dimensionsDisplay.textContent = `${this.originalCanvasWidth}×${this.originalCanvasHeight}px${scaleText}`;
      }
    }
  }

  /**
   * Check if canvas is ready
   */
  isReady() {
    return this.canvasReady;
  }

  /**
   * Get original screenshot data URL
   */
  getOriginalScreenshot() {
    return this.originalScreenshot;
  }

  /**
   * Get original image data
   */
  getOriginalImageData() {
    return this.originalImageData;
  }

  /**
   * Reset the canvas manager
   */
  reset() {
    this.originalScreenshot = '';
    this.originalImageData = null;
    this.canvasReady = false;
    this.displayScale = 1;
    this.originalCanvasWidth = 0;
    this.originalCanvasHeight = 0;
    
    if (this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Remove the ready class to hide canvas during reset
      this.canvas.classList.remove('canvas-ready');
      // Reset styles
      this.canvas.style.width = '';
      this.canvas.style.height = '';
      this.canvas.style.transform = '';
      this.canvas.style.margin = '';
    }
  }

  /**
   * Destroy the canvas manager and clean up
   */
  destroy() {
    // Clear resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // Remove resize listener
    window.removeEventListener('resize', this.centerCanvas);
    
    // Clear canvas
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Reset state
    this.reset();
    
    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.container = null;
  }
}