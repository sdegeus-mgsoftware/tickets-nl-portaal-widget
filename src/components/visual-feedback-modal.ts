import { WidgetConfig } from '@/core/types';
import { I18nManager } from '@/i18n/i18n-manager';
import { ThemeManager } from '@/styles/theme-manager';
import { createElement } from '@/utils/helpers';
import html2canvas from 'html2canvas';

export interface VisualFeedbackModalConfig {
  config: WidgetConfig;
  i18n: I18nManager;
  themeManager: ThemeManager;
  onClose: () => void;
  onSubmit: (data: FeedbackData) => void;
}

export interface FeedbackData {
  description: string;
  screenshot: string; // base64 image
  annotations: AnnotationData[];
  title?: string; // AI generated
}

export interface AnnotationData {
  type: 'rectangle' | 'arrow' | 'text' | 'freehand';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  points?: Array<{x: number, y: number}>; // for freehand
}

export class VisualFeedbackModal {
  private element: HTMLElement;
  private config: VisualFeedbackModalConfig;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private originalScreenshot: string = '';
  private annotations: AnnotationData[] = [];
  private currentTool: string = 'rectangle';
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private chatMessages: Array<{type: 'user' | 'ai', message: string}> = [];

  constructor(config: VisualFeedbackModalConfig) {
    this.config = config;
    this.element = this.createElement();
    this.attachEventListeners();
    this.render();
  }

  private createElement(): HTMLElement {
    const modal = createElement('div', {
      class: 'visual-feedback-modal',
      id: 'visual-feedback-modal'
    });

    modal.innerHTML = `
      <div class="visual-feedback-overlay"></div>
      <div class="visual-feedback-content">
        <div class="visual-feedback-header">
          <h3>Visual Feedback</h3>
          <button class="visual-feedback-close" type="button" aria-label="Close">×</button>
        </div>
        
        <div class="visual-feedback-body">
          <!-- Screenshot Loading State -->
          <div class="screenshot-loading" id="screenshot-loading">
            <div class="loading-spinner"></div>
            <p>Taking screenshot...</p>
          </div>
          
          <!-- Main Content -->
          <div class="feedback-main" id="feedback-main" style="display: none;">
            <!-- Left Panel: Screenshot with annotations -->
            <div class="screenshot-panel">
              <div class="drawing-tools">
                <button class="tool-btn active" data-tool="rectangle">📱</button>
                <button class="tool-btn" data-tool="arrow">↗️</button>
                <button class="tool-btn" data-tool="text">✏️</button>
                <button class="tool-btn" data-tool="freehand">✋</button>
                <button class="tool-btn" data-tool="clear">🗑️</button>
              </div>
              <div class="screenshot-container">
                <canvas id="annotation-canvas" class="annotation-canvas"></canvas>
              </div>
            </div>
            
            <!-- Right Panel: Chat interface -->
            <div class="chat-panel">
              <div class="chat-header">
                <h4>Describe the issue</h4>
                <small>Explain what's wrong or what you need help with</small>
              </div>
              
              <div class="chat-messages" id="chat-messages">
                <div class="ai-message">
                  <div class="message-avatar">🤖</div>
                  <div class="message-content">
                    <p>Hi! I can see you've taken a screenshot. Please describe what issue you're experiencing or what help you need.</p>
                  </div>
                </div>
              </div>
              
              <div class="chat-input-container">
                <textarea 
                  id="chat-input" 
                  placeholder="Describe the issue you're experiencing..."
                  rows="3"
                  required
                ></textarea>
                <button class="send-btn" id="send-btn" type="button">Send</button>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="feedback-actions" id="feedback-actions" style="display: none;">
            <button type="button" class="btn-cancel">Cancel</button>
            <button type="button" class="btn-submit" id="submit-feedback">Send Feedback</button>
          </div>
          
          <!-- Success State -->
          <div class="feedback-success" id="feedback-success" style="display: none;">
            <div class="success-icon">✅</div>
            <h4>Feedback Sent!</h4>
            <p>Thank you for your feedback. We'll review it and get back to you soon.</p>
          </div>
        </div>
      </div>
    `;

    return modal;
  }

  private attachEventListeners(): void {
    // Close button
    const closeBtn = this.element.querySelector('.visual-feedback-close');
    closeBtn?.addEventListener('click', this.config.onClose);

    // Cancel button
    const cancelBtn = this.element.querySelector('.btn-cancel');
    cancelBtn?.addEventListener('click', this.config.onClose);

    // Overlay click
    const overlay = this.element.querySelector('.visual-feedback-overlay');
    overlay?.addEventListener('click', this.config.onClose);

    // Drawing tools
    const toolBtns = this.element.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = (e.target as HTMLElement).dataset.tool;
        if (tool === 'clear') {
          this.clearAnnotations();
        } else if (tool) {
          this.setTool(tool);
        }
      });
    });

    // Chat functionality
    const sendBtn = this.element.querySelector('#send-btn');
    const chatInput = this.element.querySelector('#chat-input') as HTMLTextAreaElement;
    
    sendBtn?.addEventListener('click', () => this.sendMessage());
    chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Submit feedback
    const submitBtn = this.element.querySelector('#submit-feedback');
    submitBtn?.addEventListener('click', () => this.submitFeedback());
  }

  private setTool(tool: string): void {
    this.currentTool = tool;
    
    // Update active tool button
    const toolBtns = this.element.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = this.element.querySelector(`[data-tool="${tool}"]`);
    activeBtn?.classList.add('active');
  }

  private setupCanvas(): void {
    this.canvas = this.element.querySelector('#annotation-canvas') as HTMLCanvasElement;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    // Set canvas size to screenshot size
    const img = new Image();
    img.onload = () => {
      this.canvas!.width = Math.min(img.width, 800);
      this.canvas!.height = Math.min(img.height, 600);
      
      // Draw screenshot as background
      this.ctx!.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
      
      // Setup drawing events
      this.setupDrawingEvents();
    };
    img.src = this.originalScreenshot;
  }

  private setupDrawingEvents(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
  }

  private startDrawing(e: MouseEvent): void {
    if (!this.canvas || !this.ctx) return;

    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
  }

  private draw(e: MouseEvent): void {
    if (!this.isDrawing || !this.canvas || !this.ctx) return;

    const rect = this.canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Redraw screenshot and existing annotations
    this.redrawCanvas();

    // Draw current annotation preview
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 2;

    if (this.currentTool === 'rectangle') {
      this.ctx.strokeRect(
        this.startX,
        this.startY,
        currentX - this.startX,
        currentY - this.startY
      );
    }
  }

  private stopDrawing(): void {
    if (!this.isDrawing || !this.canvas || !this.ctx) return;

    this.isDrawing = false;

    // Save the annotation
    if (this.currentTool === 'rectangle') {
      this.annotations.push({
        type: 'rectangle',
        x: this.startX,
        y: this.startY,
        width: Math.abs(this.startX - this.startX),
        height: Math.abs(this.startY - this.startY),
        color: '#ff0000'
      });
    }

    this.redrawCanvas();
  }

  private redrawCanvas(): void {
    if (!this.canvas || !this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Redraw screenshot
    const img = new Image();
    img.onload = () => {
      this.ctx!.drawImage(img, 0, 0, this.canvas!.width, this.canvas!.height);
      
      // Redraw annotations
      this.annotations.forEach(annotation => {
        this.drawAnnotation(annotation);
      });
    };
    img.src = this.originalScreenshot;
  }

  private drawAnnotation(annotation: AnnotationData): void {
    if (!this.ctx) return;

    this.ctx.strokeStyle = annotation.color;
    this.ctx.lineWidth = 2;

    switch (annotation.type) {
      case 'rectangle':
        if (annotation.width && annotation.height) {
          this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        }
        break;
      // Add other annotation types later
    }
  }

  private clearAnnotations(): void {
    this.annotations = [];
    this.redrawCanvas();
  }

  private sendMessage(): void {
    const chatInput = this.element.querySelector('#chat-input') as HTMLTextAreaElement;
    const message = chatInput.value.trim();
    
    if (!message) return;

    // Add user message
    this.addChatMessage('user', message);
    chatInput.value = '';

    // Simulate AI response (replace with actual AI integration later)
    setTimeout(() => {
      this.addChatMessage('ai', 'Thank you for the description. I can see the issue in the screenshot. Is there anything specific you\'d like us to focus on?');
    }, 1000);
  }

  private addChatMessage(type: 'user' | 'ai', message: string): void {
    const chatMessages = this.element.querySelector('#chat-messages');
    if (!chatMessages) return;

    const messageEl = createElement('div', {
      class: `${type}-message`
    });

    messageEl.innerHTML = `
      <div class="message-avatar">${type === 'ai' ? '🤖' : '👤'}</div>
      <div class="message-content">
        <p>${message}</p>
      </div>
    `;

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    this.chatMessages.push({ type, message });

    // Show action buttons after first user message
    if (type === 'user' && this.chatMessages.filter(m => m.type === 'user').length >= 1) {
      const actions = this.element.querySelector('#feedback-actions') as HTMLElement;
      actions.style.display = 'flex';
    }
  }

  private async submitFeedback(): Promise<void> {
    const userMessages = this.chatMessages.filter(m => m.type === 'user');
    if (userMessages.length === 0) {
      alert('Please describe the issue before submitting.');
      return;
    }

    const feedbackData: FeedbackData = {
      description: userMessages.map(m => m.message).join('\n'),
      screenshot: this.originalScreenshot,
      annotations: this.annotations,
      title: `Feedback: ${userMessages[0].message.substring(0, 50)}...`
    };

    this.config.onSubmit(feedbackData);
    this.showSuccess();
  }

  private showSuccess(): void {
    const main = this.element.querySelector('#feedback-main') as HTMLElement;
    const actions = this.element.querySelector('#feedback-actions') as HTMLElement;
    const success = this.element.querySelector('#feedback-success') as HTMLElement;

    main.style.display = 'none';
    actions.style.display = 'none';
    success.style.display = 'block';

    // Auto close after 3 seconds
    setTimeout(() => {
      this.config.onClose();
    }, 3000);
  }

  private render(): void {
    document.body.appendChild(this.element);
    this.element.style.display = 'flex';
    this.element.classList.remove('visual-feedback-open', 'visual-feedback-opening', 'visual-feedback-closing');
  }

  public async show(): Promise<void> {
    // Start taking screenshot
    await this.takeScreenshot();
    
    // Show modal with animation
    this.element.classList.add('visual-feedback-opening');
    
    setTimeout(() => {
      this.element.classList.remove('visual-feedback-opening');
      this.element.classList.add('visual-feedback-open');
    }, 300);
  }

  public hide(): void {
    this.element.classList.remove('visual-feedback-open', 'visual-feedback-opening');
    this.element.classList.add('visual-feedback-closing');
    
    setTimeout(() => {
      this.element.classList.remove('visual-feedback-closing');
    }, 300);
  }

  private async takeScreenshot(): Promise<void> {
    try {
      // Hide the widget temporarily
      const widgetButton = document.getElementById('ticket-widget-button');
      const originalDisplay = widgetButton?.style.display;
      if (widgetButton) {
        widgetButton.style.display = 'none';
      }

      // Take screenshot
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5, // Reduce quality for performance
        width: window.innerWidth,
        height: window.innerHeight
      });

      this.originalScreenshot = canvas.toDataURL('image/png');

      // Restore widget button
      if (widgetButton && originalDisplay !== undefined) {
        widgetButton.style.display = originalDisplay;
      }

      // Hide loading and show main content
      const loading = this.element.querySelector('#screenshot-loading') as HTMLElement;
      const main = this.element.querySelector('#feedback-main') as HTMLElement;
      
      loading.style.display = 'none';
      main.style.display = 'flex';

      // Setup canvas
      this.setupCanvas();

    } catch (error) {
      console.error('Failed to take screenshot:', error);
      // Fallback - just show the interface without screenshot
      const loading = this.element.querySelector('#screenshot-loading') as HTMLElement;
      const main = this.element.querySelector('#feedback-main') as HTMLElement;
      
      loading.style.display = 'none';
      main.style.display = 'flex';
    }
  }

  public destroy(): void {
    this.element.remove();
  }
} 