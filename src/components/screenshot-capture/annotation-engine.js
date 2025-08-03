/**
 * Annotation Engine
 * Handles all drawing operations, coordinate conversion, and canvas interaction
 */

export default class AnnotationEngine {
  constructor(options = {}) {
    this.options = {
      canvas: null,
      onAnnotationComplete: null,
      ...options
    };

    this.canvas = this.options.canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    // Drawing state
    this.isDrawing = false;
    this.currentTool = 'pen';
    this.currentColor = '#ef4444';
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.currentPath = null;
    this.tempImageData = null;

    // Performance optimization
    this.drawFrame = null;
    this.lastDrawEvent = null;
    this.coordsDebugLogged = false;

    // Coordinate conversion properties
    this.displayScale = 1;
    this.originalCanvasWidth = 0;
    this.originalCanvasHeight = 0;
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;

    this.setupEventListeners();
  }

  /**
   * Setup drawing event listeners
   */
  setupEventListeners() {
    if (!this.canvas) return;

    // Mouse events with performance optimization
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseout', this.handleMouseUp.bind(this));

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouch.bind(this));
  }

  /**
   * Handle mouse down - check if it's for drawing (not panning)
   */
  handleMouseDown(e) {
    if (e.button === 0 && !e.ctrlKey) {
      // Left mouse button for drawing (not pan mode)
      this.startDrawing(e);
    }
  }

  /**
   * Handle mouse move - drawing operations
   */
  handleMouseMove(e) {
    if (this.isDrawing) {
      this.throttledDraw(e);
    }
  }

  /**
   * Handle mouse up - end drawing
   */
  handleMouseUp(e) {
    this.stopDrawing(e);
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
   * Throttled drawing using requestAnimationFrame for smooth performance
   */
  throttledDraw(e) {
    this.lastDrawEvent = e;
    
    if (this.drawFrame) {
      return; // Already have a frame scheduled
    }
    
    this.drawFrame = requestAnimationFrame(() => {
      if (this.lastDrawEvent) {
        this.draw(this.lastDrawEvent);
        this.lastDrawEvent = null;
      }
      this.drawFrame = null;
    });
  }

  /**
   * Convert screen coordinates to canvas coordinates accounting for scaling, zoom, and pan
   */
  getCanvasCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Get the mouse position relative to the canvas display area
    let displayX = e.clientX - rect.left;
    let displayY = e.clientY - rect.top;
    
    // Account for zoom and pan transformations
    // Reverse the transform to get original canvas coordinates
    displayX = (displayX - this.panX) / this.zoomLevel;
    displayY = (displayY - this.panY) / this.zoomLevel;
    
    // Calculate the actual scale ratio between canvas internal size and original display size
    const originalWidth = this.originalCanvasWidth * this.displayScale;
    const originalHeight = this.originalCanvasHeight * this.displayScale;
    
    const scaleX = this.canvas.width / originalWidth;
    const scaleY = this.canvas.height / originalHeight;
    
    // Convert display coordinates to canvas coordinates
    const canvasX = displayX * scaleX;
    const canvasY = displayY * scaleY;
    
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
    this.lastX = coords.x;
    this.lastY = coords.y;
    
    // Set up drawing style
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    if (this.currentTool === 'pen') {
      // For pen tool, initialize a path array and start drawing immediately
      this.currentPath = [{ x: coords.x, y: coords.y }];
      this.ctx.beginPath();
      this.ctx.moveTo(coords.x, coords.y);
    } else {
      // For shapes, save the current canvas state for preview mode
      this.tempImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Draw on canvas - optimized for performance
   */
  draw(e) {
    if (!this.isDrawing) return;

    const coords = this.getCanvasCoordinates(e);
    const currentX = coords.x;
    const currentY = coords.y;

    if (this.currentTool === 'pen') {
      // For pen tool: draw line segment from last point to current point
      // This is much faster than redrawing the entire path each time
      this.ctx.lineTo(currentX, currentY);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(currentX, currentY);
      
      // Add point to path array for final storage
      this.currentPath.push({ x: currentX, y: currentY });
      
      // Update last position
      this.lastX = currentX;
      this.lastY = currentY;
    } else {
      // For shapes (rectangle/arrow): use preview mode with temporary overlay
      // Restore canvas to state before preview, then draw new preview
      this.ctx.putImageData(this.tempImageData, 0, 0);
      
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (this.currentTool === 'rectangle') {
        this.ctx.strokeRect(
          this.startX,
          this.startY,
          currentX - this.startX,
          currentY - this.startY
        );
      } else if (this.currentTool === 'arrow') {
        this.drawArrow(this.startX, this.startY, currentX, currentY);
      }
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
      // For other tools, save start/end coordinates and finalize the shape
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
      
      // Make sure the final shape is properly drawn (in case of very quick clicks)
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = 3;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (this.currentTool === 'rectangle') {
        this.ctx.strokeRect(
          this.startX,
          this.startY,
          coords.x - this.startX,
          coords.y - this.startY
        );
      } else if (this.currentTool === 'arrow') {
        this.drawArrow(this.startX, this.startY, coords.x, coords.y);
      }
    }
    
    // Clear temporary data
    this.currentPath = null;
    this.tempImageData = null;
    
    // Trigger callback
    if (this.options.onAnnotationComplete) {
      this.options.onAnnotationComplete(annotation);
    }
  }

  /**
   * Draw a specific annotation on the canvas
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
   * Set the current drawing tool
   */
  setTool(tool) {
    this.currentTool = tool;
  }

  /**
   * Set the current drawing color
   */
  setColor(color) {
    this.currentColor = color;
  }

  /**
   * Update coordinate conversion properties
   */
  updateCoordinateSystem(props) {
    const { displayScale, originalCanvasWidth, originalCanvasHeight, zoomLevel, panX, panY } = props;
    
    if (displayScale !== undefined) this.displayScale = displayScale;
    if (originalCanvasWidth !== undefined) this.originalCanvasWidth = originalCanvasWidth;
    if (originalCanvasHeight !== undefined) this.originalCanvasHeight = originalCanvasHeight;
    if (zoomLevel !== undefined) this.zoomLevel = zoomLevel;
    if (panX !== undefined) this.panX = panX;
    if (panY !== undefined) this.panY = panY;
  }

  /**
   * Get current drawing state
   */
  getDrawingState() {
    return {
      isDrawing: this.isDrawing,
      currentTool: this.currentTool,
      currentColor: this.currentColor
    };
  }

  /**
   * Cancel current drawing operation
   */
  cancelDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.currentPath = null;
      
      // Restore canvas if we were drawing a shape
      if (this.tempImageData) {
        this.ctx.putImageData(this.tempImageData, 0, 0);
        this.tempImageData = null;
      }
    }
  }

  /**
   * Clear the canvas completely
   */
  clearCanvas() {
    if (this.canvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Check if currently drawing
   */
  isCurrentlyDrawing() {
    return this.isDrawing;
  }

  /**
   * Destroy the engine and clean up
   */
  destroy() {
    // Cancel any pending animation frames
    if (this.drawFrame) {
      cancelAnimationFrame(this.drawFrame);
      this.drawFrame = null;
    }

    // Cancel current drawing
    this.cancelDrawing();

    // Clear references
    this.canvas = null;
    this.ctx = null;
    this.lastDrawEvent = null;
  }
}