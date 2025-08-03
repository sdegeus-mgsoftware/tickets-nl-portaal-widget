/**
 * Zoom and Pan Controller
 * Handles canvas zooming, panning, and viewport transformations
 */

export default class ZoomPanController {
  constructor(options = {}) {
    this.options = {
      canvas: null,
      container: null,
      onZoomChange: null,
      ...options
    };

    // Zoom and pan variables
    this.zoomLevel = 1.0;
    this.minZoom = 0.1;
    this.maxZoom = 5.0;
    this.zoomStep = 0.2;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    this.canvas = this.options.canvas;
    this.setupEventListeners();
  }

  /**
   * Setup zoom and pan event listeners
   */
  setupEventListeners() {
    if (!this.canvas) return;

    // Mouse wheel for zooming
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Touch events for mobile zoom/pan
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouch.bind(this));
  }

  /**
   * Handle mouse wheel for zooming
   */
  handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    
    if (newZoom !== this.zoomLevel) {
      // Get mouse position relative to canvas
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate the point to zoom towards
      const zoomRatio = newZoom / this.zoomLevel;
      
      // Adjust pan to zoom towards mouse position
      this.panX = mouseX - (mouseX - this.panX) * zoomRatio;
      this.panY = mouseY - (mouseY - this.panY) * zoomRatio;
      
      this.zoomLevel = newZoom;
      this.updateZoomDisplay();
      this.applyTransform();
      
      if (this.options.onZoomChange) {
        this.options.onZoomChange(this.zoomLevel);
      }
    }
  }

  /**
   * Handle touch events for mobile devices
   */
  handleTouch(e) {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Two finger zoom
      this.handlePinchZoom(e);
    } else if (e.touches.length === 1) {
      // Single finger pan
      this.handleTouchPan(e);
    }
  }

  /**
   * Handle pinch-to-zoom gesture
   */
  handlePinchZoom(e) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (!this.lastPinchDistance) {
      this.lastPinchDistance = distance;
      return;
    }

    const deltaDistance = distance - this.lastPinchDistance;
    const zoomFactor = deltaDistance > 0 ? 1.02 : 0.98;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * zoomFactor));

    if (newZoom !== this.zoomLevel) {
      // Calculate center point between fingers
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Get center relative to canvas
      const rect = this.canvas.getBoundingClientRect();
      const canvasCenterX = centerX - rect.left;
      const canvasCenterY = centerY - rect.top;
      
      // Adjust pan to zoom towards center point
      const zoomRatio = newZoom / this.zoomLevel;
      this.panX = canvasCenterX - (canvasCenterX - this.panX) * zoomRatio;
      this.panY = canvasCenterY - (canvasCenterY - this.panY) * zoomRatio;
      
      this.zoomLevel = newZoom;
      this.updateZoomDisplay();
      this.applyTransform();
      
      if (this.options.onZoomChange) {
        this.options.onZoomChange(this.zoomLevel);
      }
    }

    this.lastPinchDistance = distance;
  }

  /**
   * Handle single finger pan gesture
   */
  handleTouchPan(e) {
    const touch = e.touches[0];
    
    if (e.type === 'touchstart') {
      this.lastPanX = touch.clientX;
      this.lastPanY = touch.clientY;
      this.isPanning = true;
    } else if (e.type === 'touchmove' && this.isPanning) {
      const deltaX = touch.clientX - this.lastPanX;
      const deltaY = touch.clientY - this.lastPanY;
      
      this.panX += deltaX;
      this.panY += deltaY;
      
      this.lastPanX = touch.clientX;
      this.lastPanY = touch.clientY;
      
      this.applyTransform();
    } else if (e.type === 'touchend') {
      this.isPanning = false;
      this.lastPinchDistance = null;
    }
  }

  /**
   * Handle mouse pan operations
   */
  startPan(clientX, clientY) {
    this.isPanning = true;
    this.lastPanX = clientX;
    this.lastPanY = clientY;
    if (this.canvas) {
      this.canvas.style.cursor = 'grabbing';
    }
  }

  /**
   * Continue mouse pan
   */
  continuePan(clientX, clientY) {
    if (!this.isPanning) return;
    
    const deltaX = clientX - this.lastPanX;
    const deltaY = clientY - this.lastPanY;
    
    this.panX += deltaX;
    this.panY += deltaY;
    
    this.lastPanX = clientX;
    this.lastPanY = clientY;
    
    this.applyTransform();
  }

  /**
   * End mouse pan
   */
  endPan() {
    this.isPanning = false;
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
    }
  }

  /**
   * Zoom in by one step
   */
  zoomIn() {
    const newZoom = Math.min(this.maxZoom, this.zoomLevel + this.zoomStep);
    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.updateZoomDisplay();
      this.applyTransform();
      
      if (this.options.onZoomChange) {
        this.options.onZoomChange(this.zoomLevel);
      }
    }
  }

  /**
   * Zoom out by one step
   */
  zoomOut() {
    const newZoom = Math.max(this.minZoom, this.zoomLevel - this.zoomStep);
    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.updateZoomDisplay();
      this.applyTransform();
      
      if (this.options.onZoomChange) {
        this.options.onZoomChange(this.zoomLevel);
      }
    }
  }

  /**
   * Reset zoom to 100% and center position
   */
  resetZoom() {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.updateZoomDisplay();
    this.applyTransform();
    
    if (this.options.onZoomChange) {
      this.options.onZoomChange(this.zoomLevel);
    }
  }

  /**
   * Center the canvas in the viewport
   */
  centerCanvas() {
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  /**
   * Apply zoom and pan transform to the canvas
   */
  applyTransform() {
    if (!this.canvas) return;
    
    const transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
    this.canvas.style.transform = transform;
    this.canvas.style.transformOrigin = '0 0';
  }

  /**
   * Update the zoom level display
   */
  updateZoomDisplay() {
    if (this.options.container) {
      const zoomDisplay = this.options.container.querySelector('#zoomLevel');
      if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(this.zoomLevel * 100)}%`;
      }
    }
  }

  /**
   * Get current zoom level
   */
  getZoomLevel() {
    return this.zoomLevel;
  }

  /**
   * Get current pan position
   */
  getPanPosition() {
    return { x: this.panX, y: this.panY };
  }

  /**
   * Set zoom level programmatically
   */
  setZoomLevel(zoom) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.updateZoomDisplay();
    this.applyTransform();
    
    if (this.options.onZoomChange) {
      this.options.onZoomChange(this.zoomLevel);
    }
  }

  /**
   * Set pan position programmatically
   */
  setPanPosition(x, y) {
    this.panX = x;
    this.panY = y;
    this.applyTransform();
  }

  /**
   * Check if currently panning
   */
  isPanningActive() {
    return this.isPanning;
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Event listeners will be cleaned up when canvas is removed
    this.isPanning = false;
    this.canvas = null;
  }
}