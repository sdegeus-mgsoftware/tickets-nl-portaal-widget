/**
 * Step Replication Component
 * Handles screen recording and user interaction tracking
 */

export default class StepReplication {
  constructor(options = {}) {
    this.options = {
      onRecordingStart: null,
      onRecordingStop: null,
      onStepAdded: null,
      ...options
    };

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.replicationSteps = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.stepListeners = [];
    this.stream = null;
    this.recordingData = null;

    this.init();
  }

  /**
   * Initialize the step replication component
   */
  init() {
    // Component is ready but not recording yet
  }

  /**
   * Start recording screen and interactions
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      // Request screen capture permission
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      // Set up MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.getRecorderMimeType()
      });

      this.recordedChunks = [];
      this.replicationSteps = [];
      this.recordingStartTime = Date.now();
      this.isRecording = true;

      // Handle recorded data
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      });

      // Handle recording stop
      this.mediaRecorder.addEventListener('stop', () => {
        this.finalizeRecording();
      });

      // Start recording
      this.mediaRecorder.start();

      // Set up interaction tracking
      this.setupInteractionTracking();

      // Add initial step
      this.addReplicationStep('🎬 Started recording user interactions');

      // Handle stream end (user stops sharing)
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (this.isRecording) {
          this.stopRecording();
        }
      });

      // Trigger callback
      if (this.options.onRecordingStart) {
        this.options.onRecordingStart();
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;

    // Stop media recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // Stop all video tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    // Remove interaction listeners
    this.removeInteractionTracking();

    // Add final step
    this.addReplicationStep('⏹️ Stopped recording');

    // Trigger callback
    if (this.options.onRecordingStop) {
      this.options.onRecordingStop(this.recordingData);
    }
  }

  /**
   * Finalize recording and create video blob
   */
  finalizeRecording() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);
    
    this.recordingData = {
      videoUrl: videoUrl,
      videoBlob: blob,
      steps: [...this.replicationSteps],
      duration: Date.now() - this.recordingStartTime,
      startTime: this.recordingStartTime,
      endTime: Date.now()
    };

    }

  /**
   * Set up interaction tracking
   */
  setupInteractionTracking() {
    // Track clicks on the main page
    const clickListener = (e) => {
      if (e.target.closest('.visual-feedback-modal')) return; // Ignore clicks in modal
      
      const element = e.target;
      const rect = element.getBoundingClientRect();
      const selector = this.generateSelector(element);
      
      this.addReplicationStep(`🖱️ Clicked: ${selector} at (${Math.round(rect.left + rect.width/2)}, ${Math.round(rect.top + rect.height/2)})`);
    };

    // Track scrolling
    const scrollListener = this.debounce(() => {
      this.addReplicationStep(`📜 Scrolled to: (${window.scrollX}, ${window.scrollY})`);
    }, 500);

    // Track key presses
    const keyListener = (e) => {
      if (e.target.closest('.visual-feedback-modal')) return; // Ignore keys in modal
      
      const key = e.key;
      const element = e.target;
      const selector = this.generateSelector(element);
      
      if (key.length === 1) {
        this.addReplicationStep(`⌨️ Typed '${key}' in: ${selector}`);
      } else if (['Enter', 'Tab', 'Escape', 'Backspace', 'Delete'].includes(key)) {
        this.addReplicationStep(`⌨️ Pressed ${key} in: ${selector}`);
      }
    };

    // Track form interactions
    const changeListener = (e) => {
      if (e.target.closest('.visual-feedback-modal')) return; // Ignore changes in modal
      
      const element = e.target;
      const selector = this.generateSelector(element);
      const value = element.value;
      
      this.addReplicationStep(`📝 Changed ${selector} to: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
    };

    // Track focus changes
    const focusListener = (e) => {
      if (e.target.closest('.visual-feedback-modal')) return; // Ignore focus in modal
      
      const element = e.target;
      const selector = this.generateSelector(element);
      
      this.addReplicationStep(`👁️ Focused on: ${selector}`);
    };

    // Track page navigation
    const navigationListener = () => {
      this.addReplicationStep(`🧭 Navigated to: ${window.location.href}`);
    };

    // Track window resize
    const resizeListener = this.debounce(() => {
      this.addReplicationStep(`📐 Window resized to: ${window.innerWidth}×${window.innerHeight}`);
    }, 1000);

    // Add listeners to document
    document.addEventListener('click', clickListener, true);
    document.addEventListener('scroll', scrollListener, true);
    document.addEventListener('keydown', keyListener, true);
    document.addEventListener('change', changeListener, true);
    document.addEventListener('focus', focusListener, true);
    window.addEventListener('popstate', navigationListener);
    window.addEventListener('resize', resizeListener);

    // Store listeners for cleanup
    this.stepListeners = [
      { element: document, type: 'click', listener: clickListener, useCapture: true },
      { element: document, type: 'scroll', listener: scrollListener, useCapture: true },
      { element: document, type: 'keydown', listener: keyListener, useCapture: true },
      { element: document, type: 'change', listener: changeListener, useCapture: true },
      { element: document, type: 'focus', listener: focusListener, useCapture: true },
      { element: window, type: 'popstate', listener: navigationListener, useCapture: false },
      { element: window, type: 'resize', listener: resizeListener, useCapture: false }
    ];
  }

  /**
   * Remove interaction tracking
   */
  removeInteractionTracking() {
    this.stepListeners.forEach(({ element, type, listener, useCapture }) => {
      element.removeEventListener(type, listener, useCapture);
    });
    this.stepListeners = [];
  }

  /**
   * Add a replication step
   */
  addReplicationStep(description) {
    const timestamp = Date.now();
    const relativeTime = this.recordingStartTime ? Math.round((timestamp - this.recordingStartTime) / 1000) : 0;
    
    const step = {
      description,
      timestamp,
      relativeTime,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY
      }
    };
    
    this.replicationSteps.push(step);
    
    // Trigger callback
    if (this.options.onStepAdded) {
      this.options.onStepAdded(step);
    }
  }

  /**
   * Generate a CSS selector for an element
   */
  generateSelector(element) {
    // Try ID first
    if (element.id) {
      return `#${element.id}`;
    }
    
    // Try class name
    if (element.className && typeof element.className === 'string') {
      const className = element.className.split(' ')[0];
      if (className) {
        return `.${className}`;
      }
    }
    
    // Try data attributes
    for (const attr of element.attributes) {
      if (attr.name.startsWith('data-')) {
        return `[${attr.name}="${attr.value}"]`;
      }
    }
    
    // Try name attribute
    if (element.name) {
      return `[name="${element.name}"]`;
    }
    
    // Try type and tag
    if (element.type) {
      return `${element.tagName.toLowerCase()}[type="${element.type}"]`;
    }
    
    // Try text content for links and buttons
    if (['A', 'BUTTON'].includes(element.tagName)) {
      const text = element.textContent?.trim().substring(0, 20);
      if (text) {
        return `${element.tagName.toLowerCase()}[text="${text}"]`;
      }
    }
    
    // Fall back to tag name
    return element.tagName.toLowerCase();
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  getRecorderMimeType() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return ''; // Let browser choose
  }

  /**
   * Debounce function to limit event firing
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get recording data
   */
  getRecordingData() {
    return this.recordingData || {
      videoUrl: null,
      videoBlob: null,
      steps: [...this.replicationSteps],
      duration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
      startTime: this.recordingStartTime,
      endTime: this.isRecording ? null : Date.now()
    };
  }

  /**
   * Get all recorded steps
   */
  getSteps() {
    return [...this.replicationSteps];
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }

  /**
   * Reset the component
   */
  reset() {
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clean up
    this.recordedChunks = [];
    this.replicationSteps = [];
    this.recordingData = null;
    this.recordingStartTime = null;
    
    // Clean up video URL
    if (this.recordingData?.videoUrl) {
      URL.revokeObjectURL(this.recordingData.videoUrl);
    }
  }

  /**
   * Destroy the component and clean up
   */
  destroy() {
    // Stop recording
    this.reset();
    
    // Remove all listeners
    this.removeInteractionTracking();
    
    // Stop stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
} 