/**
 * Screenshot Processor
 * Handles html2canvas integration, UI hiding, and screenshot generation
 */

export default class ScreenshotProcessor {
  constructor(options = {}) {
    this.options = {
      onProgress: null,
      onComplete: null,
      ...options
    };

    this.originalScreenshot = '';
    this.isProcessing = false;
  }

  /**
   * Take a screenshot of the page
   */
  async takeScreenshot() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    
    if (this.isProcessing) {
      throw new Error('Screenshot already in progress');
    }

    this.isProcessing = true;

    try {
      return await new Promise((resolve, reject) => {
        // Import html2canvas dynamically
        if (typeof html2canvas === 'undefined') {

          this.loadHtml2Canvas()
            .then(() => {

              this.captureScreen(resolve, reject);
            })
            .catch((error) => {

              reject(error);
            });
        } else {

          this.captureScreen(resolve, reject);
        }
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Load html2canvas library dynamically
   */
  loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(script);
    });
  }

  /**
   * Capture the screen using html2canvas
   */
  async captureScreen(resolve, reject) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;
    
    try {

      
      // Hide UI elements and store their states
      const hiddenElements = this.hideUIElements();
      
      // Wait for layout to stabilize

      const stabilizeStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 250));

      
      // Get viewport information
      const viewportInfo = this.getViewportInfo();

      
      // Capture and process screenshot
      const screenshotCanvas = await this.captureFullPageAndCrop(viewportInfo);
      
      // Restore UI elements
      this.restoreUIElements(hiddenElements);
      
      // Convert to data URL

      const pngStart = Date.now();
      this.originalScreenshot = screenshotCanvas.toDataURL('image/png');



      
      if (this.options.onComplete) {
        this.options.onComplete(screenshotCanvas, this.originalScreenshot);
      }
      
      resolve({ canvas: screenshotCanvas, dataUrl: this.originalScreenshot });
    } catch (error) {

      reject(error);
    }
  }

  /**
   * Hide UI elements that shouldn't appear in screenshots
   */
  hideUIElements() {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    const elementsToHide = [
      { selector: '#visualFeedbackModal', element: document.getElementById('visualFeedbackModal') },
      { selector: '#stopRecordingFloating', element: document.getElementById('stopRecordingFloating') },
      { selector: '#screenshotLoadingIndicator', element: document.getElementById('screenshotLoadingIndicator') }
    ];

    // Hide ALL help buttons (there might be multiple)
    const helpButtons = document.querySelectorAll('.help-button');
    helpButtons.forEach((button, index) => {
      if (button) {
        elementsToHide.push({
          selector: `.help-button[${index}]`,
          element: button
        });
      }
    });

    // Store original states and hide elements

    const hiddenElements = [];

    elementsToHide.forEach(({ selector, element }) => {
      if (element) {
        const originalState = {
          element,
          selector,
          cssText: element.style.cssText,
          display: element.style.display,
          wasVisible: element.style.display !== 'none'
        };

        // Hide the element
        element.style.display = 'none';


        hiddenElements.push(originalState);
      }
    });

    return hiddenElements;
  }

  /**
   * Restore UI elements to their original state
   */
  restoreUIElements(hiddenElements) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;


    hiddenElements.forEach(({ element, selector, cssText, display, wasVisible }) => {
      if (element) {
        if (wasVisible) {
          if (cssText) {
            element.style.cssText = cssText;
          } else {
            element.style.display = display || 'flex';
          }
        }

      }
    });
  }

  /**
   * Get current viewport information
   */
  getViewportInfo() {
    return {
      scrollX: window.pageXOffset || document.documentElement.scrollLeft,
      scrollY: window.pageYOffset || document.documentElement.scrollTop,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Capture full page and crop to viewport
   */
  async captureFullPageAndCrop(viewportInfo) {
    const timestamp = () => `[${new Date().toLocaleTimeString()}.${Date.now() % 1000}]`;

    const captureStart = Date.now();

    // Temporarily ensure body has the background styles applied
    const originalBodyStyles = document.body.style.cssText;
    const computedStyles = window.getComputedStyle(document.body);
    
    // Ensure background is explicitly set on body for html2canvas
    if (computedStyles.background || computedStyles.backgroundImage) {
      document.body.style.background = computedStyles.background;
      document.body.style.backgroundImage = computedStyles.backgroundImage;
      document.body.style.backgroundSize = computedStyles.backgroundSize;
      document.body.style.backgroundPosition = computedStyles.backgroundPosition;
      document.body.style.backgroundRepeat = computedStyles.backgroundRepeat;
      document.body.style.backgroundAttachment = computedStyles.backgroundAttachment;
    }

    // Capture the full page - using document.body to maintain coordinate system
    const fullCanvas = await html2canvas(document.body, {
      useCORS: true,
      scale: 1,
      allowTaint: true,
      logging: false, // Disable html2canvas logging for cleaner output
      backgroundColor: null, // Don't override with white
      width: window.innerWidth,
      height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
    });

    // Restore original body styles
    document.body.style.cssText = originalBodyStyles;


    // Create cropped canvas for viewport
    const croppedCanvas = this.cropToViewport(fullCanvas, viewportInfo);




    return croppedCanvas;
  }

  /**
   * Crop full page canvas to current viewport
   */
  cropToViewport(fullCanvas, viewportInfo) {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = viewportInfo.width;
    croppedCanvas.height = viewportInfo.height;
    const ctx = croppedCanvas.getContext('2d');

    // Draw only the viewport area from the full screenshot
    ctx.drawImage(
      fullCanvas,
      viewportInfo.scrollX, viewportInfo.scrollY, viewportInfo.width, viewportInfo.height, // Source rectangle
      0, 0, viewportInfo.width, viewportInfo.height // Destination rectangle
    );

    return croppedCanvas;
  }

  /**
   * Get the original screenshot data URL
   */
  getOriginalScreenshot() {
    return this.originalScreenshot;
  }

  /**
   * Check if screenshot processing is in progress
   */
  isProcessingScreenshot() {
    return this.isProcessing;
  }

  /**
   * Clear stored screenshot data
   */
  clearScreenshot() {
    this.originalScreenshot = '';
  }

  /**
   * Create a canvas from image data URL
   */
  createCanvasFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Failed to load image from data URL'));
      img.src = dataUrl;
    });
  }

  /**
   * Destroy the processor and clean up
   */
  destroy() {
    this.clearScreenshot();
    this.isProcessing = false;
  }
}