/**
 * Recording Controller
 * Handles screen recording functionality
 */

export default class RecordingController {
  constructor(components, modalElement, floatingStopButton) {
    this.components = components;
    this.modalElement = modalElement;
    this.floatingStopButton = floatingStopButton;
    this.isRecording = false;
    this.originalBodyStyles = null;
  }

  /**
   * Start recording steps
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      await this.components.stepReplication.startRecording();
      this.isRecording = true;
      
      // Hide modal and show floating stop button
      this.modalElement.style.display = 'none';
      this.floatingStopButton.style.display = 'flex';
      
      // Store current body styles
      this.originalBodyStyles = document.body.getAttribute('style') || '';
      
      // Temporarily restore body styles while recording
      if (this.originalBodyStyles) {
        document.body.setAttribute('style', this.originalBodyStyles);
      } else {
        document.body.removeAttribute('style');
      }
      
      // Add instruction message
      this.components.chatInterface.addMessage('ai', `🎬 **Recording Started!**

The modal has been minimized so you can interact with the page. 

📹 **Screen recording is active**
📝 **All your interactions are being tracked**
🔴 **Look for the red "Stop Recording" button** at the bottom-right

**Go ahead and reproduce the issue** - click, scroll, type, or do whatever causes the problem. When you're done, click the floating "Stop Recording" button to return to this feedback form.`);
      
      return { success: true };
    } catch (error) {
      console.error('Error starting recording:', error);
      return { 
        success: false, 
        error: 'Unable to start screen recording. Please ensure you grant permission to capture your screen.' 
      };
    }
  }

  /**
   * Stop recording steps
   */
  stopRecording() {
    if (!this.isRecording) return;

    this.components.stepReplication.stopRecording();
    this.isRecording = false;
    
    // Show modal and hide floating stop button
    this.modalElement.style.display = 'flex';
    this.floatingStopButton.style.display = 'none';
    
    // Re-apply overflow hidden to body when modal returns
    const currentBodyStyle = document.body.getAttribute('style') || '';
    document.body.setAttribute('style', currentBodyStyle + '; overflow: hidden !important;');
    
    // Get recording data
    const recordingData = this.components.stepReplication.getRecordingData();
    
    // Show completion message
    const duration = Math.round(recordingData.duration / 1000);
    this.components.chatInterface.addMessage('ai', `✅ **Recording Complete!**

📹 **Screen Recording:** ${duration}s video captured
📝 **Steps Recorded:** ${recordingData.steps.length} interactions tracked
🎯 **Ready for Submission:** Your replication data is now included with the feedback

The recording and step-by-step interactions will be sent along with your feedback to help developers reproduce the issue exactly as you experienced it.`);

    return { success: true, recordingData };
  }

  /**
   * Check if recording is active
   */
  isRecordingActive() {
    return this.isRecording;
  }

  /**
   * Get recording data
   */
  getRecordingData() {
    if (this.components.stepReplication) {
      return this.components.stepReplication.getRecordingData();
    }
    return null;
  }

  /**
   * Reset recording state
   */
  reset() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.components.stepReplication) {
      this.components.stepReplication.reset();
    }
  }

  /**
   * Clean up recording controller
   */
  destroy() {
    this.reset();
  }
}