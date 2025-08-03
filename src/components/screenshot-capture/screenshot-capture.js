/**
 * Screenshot Capture - Main Orchestrator
 * Coordinates all screenshot capture modules and provides unified API
 */

import DrawingTools from './drawing-tools.js';
import ZoomPanController from './zoom-pan-controller.js';
import ScreenshotProcessor from './screenshot-processor.js';
import AnnotationEngine from './annotation-engine.js';
import CanvasManager from './canvas-manager.js';
import AnnotationStorage from './annotation-storage.js';

export default class ScreenshotCapture {
  constructor(options = {}) {
    this.options = {
      container: null,
      onAnnotationChange: null,
      ...options
    };

    // Module instances
    this.drawingTools = null;
    this.zoomPanController = null;
    this.screenshotProcessor = null;
    this.annotationEngine = null;
    this.canvasManager = null;
    this.annotationStorage = null;

    // State
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize the screenshot capture component
   */
  init() {
    if (!this.options.container) {
      throw new Error('Container is required for ScreenshotCapture');
    }

    this.createUI();
    this.setupModules();
    this.isInitialized = true;
  }

  /**
   * Create the main UI structure
   */
  createUI() {
    // Create the main container structure
    this.options.container.innerHTML = `
      <div class="drawing-tools-container"></div>
      <div class="screenshot-container">
        <canvas id="screenshotCanvas"></canvas>
      </div>
    `;
  }

  /**
   * Setup all modules and their interconnections
   */
  setupModules() {
    const canvas = this.options.container.querySelector('#screenshotCanvas');
    const drawingToolsContainer = this.options.container.querySelector('.drawing-tools-container');

    // Initialize annotation storage first
    this.annotationStorage = new AnnotationStorage({
      onAnnotationChange: (annotations) => {
        this.canvasManager?.redrawCanvas(annotations);
        if (this.options.onAnnotationChange) {
          this.options.onAnnotationChange(annotations);
        }
      }
    });

    // Initialize canvas manager
    this.canvasManager = new CanvasManager({
      canvas: canvas,
      container: this.options.container,
      onReady: () => {
        this.updateAnnotationEngineCoordinates();
      }
    });

    // Initialize annotation engine
    this.annotationEngine = new AnnotationEngine({
      canvas: canvas,
      onAnnotationComplete: (annotation) => {
        this.annotationStorage.addAnnotation(annotation);
      }
    });

    // Initialize zoom/pan controller
    this.zoomPanController = new ZoomPanController({
      canvas: canvas,
      container: this.options.container,
      onZoomChange: (zoomLevel) => {
        this.updateAnnotationEngineCoordinates();
        this.drawingTools?.updateZoomDisplay(zoomLevel);
      }
    });

    // Initialize drawing tools
    this.drawingTools = new DrawingTools({
      container: drawingToolsContainer,
      onToolChange: (tool) => {
        this.annotationEngine.setTool(tool);
      },
      onColorChange: (color) => {
        this.annotationEngine.setColor(color);
      },
      onAction: (action) => {
        this.handleToolAction(action);
      }
    });

    // Initialize screenshot processor
    this.screenshotProcessor = new ScreenshotProcessor({
      onComplete: (canvas, dataUrl) => {
        this.canvasManager.setupCanvas(canvas, dataUrl).then(() => {
          // Canvas is ready, update coordinate system
          this.updateAnnotationEngineCoordinates();
        });
      }
    });

    // Create the drawing tools UI
    this.drawingTools.createUI();

    // Setup mouse event coordination between modules
    this.setupEventCoordination();
  }

  /**
   * Setup event coordination between zoom/pan and annotation modules
   */
  setupEventCoordination() {
    const canvas = this.canvasManager.canvas;
    if (!canvas) return;

    // Override the annotation engine's mouse down handler to coordinate with zoom/pan
    const originalMouseDown = this.annotationEngine.handleMouseDown.bind(this.annotationEngine);
    
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
        // Middle mouse or Ctrl+Left click for panning
        this.zoomPanController.startPan(e.clientX, e.clientY);
        e.preventDefault();
      } else if (e.button === 0) {
        // Left mouse button for drawing
        originalMouseDown(e);
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.zoomPanController.isPanningActive()) {
        this.zoomPanController.continuePan(e.clientX, e.clientY);
        this.updateAnnotationEngineCoordinates();
        e.preventDefault();
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (this.zoomPanController.isPanningActive()) {
        this.zoomPanController.endPan();
      }
    });
  }

  /**
   * Handle tool action buttons
   */
  handleToolAction(action) {
    switch (action) {
      case 'clear':
        this.clearAnnotations();
        break;
      case 'undo':
        this.undoAnnotation();
        break;
      case 'center':
        this.centerCanvas();
        break;
      case 'zoom-in':
        this.zoomIn();
        break;
      case 'zoom-out':
        this.zoomOut();
        break;
      case 'zoom-reset':
        this.resetZoom();
        break;
    }
  }

  /**
   * Update annotation engine coordinate system with current state
   */
  updateAnnotationEngineCoordinates() {
    if (!this.annotationEngine || !this.canvasManager || !this.zoomPanController) return;

    const canvasInfo = this.canvasManager.getCanvasInfo();
    const zoomLevel = this.zoomPanController.getZoomLevel();
    const panPosition = this.zoomPanController.getPanPosition();

    this.annotationEngine.updateCoordinateSystem({
      displayScale: canvasInfo.displayScale,
      originalCanvasWidth: canvasInfo.originalWidth,
      originalCanvasHeight: canvasInfo.originalHeight,
      zoomLevel: zoomLevel,
      panX: panPosition.x,
      panY: panPosition.y
    });

    // Update dimensions display
    this.canvasManager.updateDimensionsDisplay();
  }

  /**
   * Take a screenshot of the page
   */
  async takeScreenshot() {
    if (!this.screenshotProcessor) {
      throw new Error('Screenshot processor not initialized');
    }

    try {
      const result = await this.screenshotProcessor.takeScreenshot();
      return result;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }

  /**
   * Center the canvas when ready
   */
  centerCanvasWhenReady() {
    if (this.canvasManager) {
      this.canvasManager.centerCanvasWhenReady();
      this.updateAnnotationEngineCoordinates();
    }
  }

  /**
   * Center the canvas
   */
  centerCanvas() {
    if (this.canvasManager) {
      this.canvasManager.centerCanvas();
      this.updateAnnotationEngineCoordinates();
    }
    if (this.zoomPanController) {
      this.zoomPanController.centerCanvas();
    }
  }

  /**
   * Zoom in
   */
  zoomIn() {
    if (this.zoomPanController) {
      this.zoomPanController.zoomIn();
      this.updateAnnotationEngineCoordinates();
    }
  }

  /**
   * Zoom out
   */
  zoomOut() {
    if (this.zoomPanController) {
      this.zoomPanController.zoomOut();
      this.updateAnnotationEngineCoordinates();
    }
  }

  /**
   * Reset zoom to 100%
   */
  resetZoom() {
    if (this.zoomPanController) {
      this.zoomPanController.resetZoom();
      this.updateAnnotationEngineCoordinates();
    }
  }

  /**
   * Clear all annotations
   */
  clearAnnotations() {
    if (this.annotationStorage) {
      this.annotationStorage.clearAnnotations();
    }
  }

  /**
   * Undo last annotation
   */
  undoAnnotation() {
    if (this.annotationStorage) {
      this.annotationStorage.undo();
    }
  }

  /**
   * Redo last undone annotation
   */
  redoAnnotation() {
    if (this.annotationStorage) {
      this.annotationStorage.redo();
    }
  }

  /**
   * Set the current drawing tool
   */
  setTool(tool) {
    if (this.drawingTools) {
      this.drawingTools.setTool(tool);
    }
  }

  /**
   * Set the current drawing color
   */
  setColor(color) {
    if (this.drawingTools) {
      this.drawingTools.setColor(color);
    }
  }

  /**
   * Get the current screenshot data with annotations
   */
  getScreenshotData() {
    return this.canvasManager?.getScreenshotData() || null;
  }

  /**
   * Get all annotations
   */
  getAnnotations() {
    return this.annotationStorage?.getAnnotations() || [];
  }

  /**
   * Get original screenshot data URL
   */
  getOriginalScreenshot() {
    return this.canvasManager?.getOriginalScreenshot() || '';
  }

  /**
   * Check if component is ready
   */
  isReady() {
    return this.canvasManager?.isReady() || false;
  }

  /**
   * Get component status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      canvasReady: this.canvasManager?.isReady() || false,
      annotationCount: this.annotationStorage?.getCount() || 0,
      canUndo: this.annotationStorage?.canUndo() || false,
      canRedo: this.annotationStorage?.canRedo() || false,
      currentTool: this.drawingTools?.getCurrentTool() || 'pen',
      currentColor: this.drawingTools?.getCurrentColor() || '#ef4444',
      zoomLevel: this.zoomPanController?.getZoomLevel() || 1.0
    };
  }

  /**
   * Reset the component
   */
  reset() {
    // Reset all modules
    this.annotationStorage?.reset();
    this.canvasManager?.reset();
    this.annotationEngine?.cancelDrawing();
    this.zoomPanController?.resetZoom();
    
    // Update displays
    this.drawingTools?.updateZoomDisplay(1.0);
    this.drawingTools?.updateDimensionsDisplay(0, 0);
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Destroy all modules
    this.drawingTools?.destroy();
    this.zoomPanController?.destroy();
    this.screenshotProcessor?.destroy();
    this.annotationEngine?.destroy();
    this.canvasManager?.destroy();
    this.annotationStorage?.destroy();

    // Clear references
    this.drawingTools = null;
    this.zoomPanController = null;
    this.screenshotProcessor = null;
    this.annotationEngine = null;
    this.canvasManager = null;
    this.annotationStorage = null;

    // Clear container
    if (this.options.container) {
      this.options.container.innerHTML = '';
    }

    this.isInitialized = false;
  }
}