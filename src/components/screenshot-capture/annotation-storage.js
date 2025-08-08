/**
 * Annotation Storage
 * Handles annotation data management, undo/redo functionality, and persistence
 */

export default class AnnotationStorage {
  constructor(options = {}) {
    this.options = {
      onAnnotationChange: null,
      maxUndoLevels: 50,
      ...options
    };

    this.annotations = [];
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoLevels = this.options.maxUndoLevels;
  }

  /**
   * Add a new annotation
   */
  addAnnotation(annotation) {
    // Add timestamp if not present
    if (!annotation.timestamp) {
      annotation.timestamp = Date.now();
    }

    // Add unique ID for tracking
    annotation.id = this.generateAnnotationId();

    // Save current state to undo stack before making changes
    this.saveStateToUndoStack();

    // Add annotation
    this.annotations.push(annotation);

    // Clear redo stack since we're making a new change
    this.redoStack = [];

    // Trigger change callback
    this.triggerChange();

    return annotation;
  }

  /**
   * Remove an annotation by ID
   */
  removeAnnotation(annotationId) {
    const index = this.annotations.findIndex(ann => ann.id === annotationId);
    if (index !== -1) {
      // Save current state to undo stack
      this.saveStateToUndoStack();

      // Remove annotation
      this.annotations.splice(index, 1);

      // Clear redo stack
      this.redoStack = [];

      // Trigger change callback
      this.triggerChange();

      return true;
    }
    return false;
  }

  /**
   * Update an existing annotation
   */
  updateAnnotation(annotationId, updates) {
    const annotation = this.annotations.find(ann => ann.id === annotationId);
    if (annotation) {
      // Save current state to undo stack
      this.saveStateToUndoStack();

      // Apply updates
      Object.assign(annotation, updates);
      annotation.lastModified = Date.now();

      // Clear redo stack
      this.redoStack = [];

      // Trigger change callback
      this.triggerChange();

      return annotation;
    }
    return null;
  }

  /**
   * Get all annotations
   */
  getAnnotations() {
    return [...this.annotations]; // Return a copy
  }

  /**
   * Get annotation by ID
   */
  getAnnotation(annotationId) {
    return this.annotations.find(ann => ann.id === annotationId);
  }

  /**
   * Get annotations by type
   */
  getAnnotationsByType(type) {
    return this.annotations.filter(ann => ann.type === type);
  }

  /**
   * Get annotations by color
   */
  getAnnotationsByColor(color) {
    return this.annotations.filter(ann => ann.color === color);
  }

  /**
   * Clear all annotations
   */
  clearAnnotations() {
    if (this.annotations.length > 0) {
      // Save current state to undo stack
      this.saveStateToUndoStack();

      // Clear annotations
      this.annotations = [];

      // Clear redo stack
      this.redoStack = [];

      // Trigger change callback
      this.triggerChange();
    }
  }

  /**
   * Undo last annotation operation
   */
  undo() {
    if (this.undoStack.length > 0) {
      // Save current state to redo stack
      this.redoStack.push([...this.annotations]);

      // Restore previous state
      this.annotations = this.undoStack.pop();

      // Trigger change callback
      this.triggerChange();

      return true;
    }
    return false;
  }

  /**
   * Redo last undone operation
   */
  redo() {
    if (this.redoStack.length > 0) {
      // Save current state to undo stack
      this.undoStack.push([...this.annotations]);

      // Restore next state
      this.annotations = this.redoStack.pop();

      // Trigger change callback
      this.triggerChange();

      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Get the number of annotations
   */
  getCount() {
    return this.annotations.length;
  }

  /**
   * Get annotations statistics
   */
  getStatistics() {
    const stats = {
      total: this.annotations.length,
      byType: {},
      byColor: {},
      oldestTimestamp: null,
      newestTimestamp: null
    };

    this.annotations.forEach(annotation => {
      // Count by type
      stats.byType[annotation.type] = (stats.byType[annotation.type] || 0) + 1;

      // Count by color
      stats.byColor[annotation.color] = (stats.byColor[annotation.color] || 0) + 1;

      // Track timestamps
      if (annotation.timestamp) {
        if (!stats.oldestTimestamp || annotation.timestamp < stats.oldestTimestamp) {
          stats.oldestTimestamp = annotation.timestamp;
        }
        if (!stats.newestTimestamp || annotation.timestamp > stats.newestTimestamp) {
          stats.newestTimestamp = annotation.timestamp;
        }
      }
    });

    return stats;
  }

  /**
   * Export annotations to JSON
   */
  exportToJSON() {
    return JSON.stringify({
      annotations: this.annotations,
      exportedAt: Date.now(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * Import annotations from JSON
   */
  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.annotations && Array.isArray(data.annotations)) {
        // Save current state to undo stack
        this.saveStateToUndoStack();

        // Import annotations
        this.annotations = data.annotations.map(annotation => ({
          ...annotation,
          id: annotation.id || this.generateAnnotationId(), // Ensure ID exists
          importedAt: Date.now()
        }));

        // Clear redo stack
        this.redoStack = [];

        // Trigger change callback
        this.triggerChange();

        return true;
      }
    } catch (error) {
    }
    return false;
  }

  /**
   * Load annotations from an array
   */
  loadAnnotations(annotationsArray) {
    if (!Array.isArray(annotationsArray)) {
      return false;
    }

    // Save current state to undo stack
    this.saveStateToUndoStack();

    // Load annotations
    this.annotations = annotationsArray.map(annotation => ({
      ...annotation,
      id: annotation.id || this.generateAnnotationId(),
      loadedAt: Date.now()
    }));

    // Clear redo stack
    this.redoStack = [];

    // Trigger change callback
    this.triggerChange();

    return true;
  }

  /**
   * Save current state to undo stack
   */
  saveStateToUndoStack() {
    // Create a deep copy of current annotations
    const stateCopy = this.annotations.map(annotation => ({ ...annotation }));
    
    // Add to undo stack
    this.undoStack.push(stateCopy);

    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoLevels) {
      this.undoStack.shift(); // Remove oldest state
    }
  }

  /**
   * Generate unique annotation ID
   */
  generateAnnotationId() {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Trigger annotation change callback
   */
  triggerChange() {
    if (this.options.onAnnotationChange) {
      this.options.onAnnotationChange(this.getAnnotations());
    }
  }

  /**
   * Validate annotation object
   */
  validateAnnotation(annotation) {
    const requiredFields = ['type', 'color'];
    const validTypes = ['pen', 'rectangle', 'arrow'];

    // Check required fields
    for (const field of requiredFields) {
      if (!annotation[field]) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Check valid type
    if (!validTypes.includes(annotation.type)) {
      return { valid: false, error: `Invalid annotation type: ${annotation.type}` };
    }

    // Type-specific validation
    if (annotation.type === 'pen') {
      if (!annotation.path || !Array.isArray(annotation.path) || annotation.path.length === 0) {
        return { valid: false, error: 'Pen annotation requires a valid path array' };
      }
    } else {
      // Rectangle and arrow require start/end coordinates
      const requiredCoords = ['startX', 'startY', 'endX', 'endY'];
      for (const coord of requiredCoords) {
        if (typeof annotation[coord] !== 'number') {
          return { valid: false, error: `Missing or invalid coordinate: ${coord}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Reset storage to initial state
   */
  reset() {
    this.annotations = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get memory usage information (for debugging)
   */
  getMemoryInfo() {
    return {
      annotationsCount: this.annotations.length,
      undoStackSize: this.undoStack.length,
      redoStackSize: this.redoStack.length,
      estimatedMemoryKB: Math.round((JSON.stringify(this.annotations).length + 
                                   JSON.stringify(this.undoStack).length + 
                                   JSON.stringify(this.redoStack).length) / 1024)
    };
  }

  /**
   * Destroy the storage and clean up
   */
  destroy() {
    this.reset();
    this.options.onAnnotationChange = null;
  }
}