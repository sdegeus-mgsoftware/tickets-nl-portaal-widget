import { PositionType, ThemeType } from '@/core/types';
import { createElement } from '@/utils/helpers';

export interface WidgetButtonConfig {
  text: string;
  position: PositionType;
  theme: ThemeType;
  onClick: () => void;
}

export class WidgetButton {
  private element: HTMLElement;
  private config: WidgetButtonConfig;

  constructor(config: WidgetButtonConfig) {
    this.config = config;
    this.element = this.createElement();
    this.attachEventListeners();
    this.render();
  }

  private createElement(): HTMLElement {
    const button = createElement('div', {
      class: `ticket-widget-button ticket-widget-${this.config.position} ticket-widget-theme-${this.config.theme}`,
      id: 'ticket-widget-button'
    });

    button.innerHTML = `
      <button class="ticket-widget-trigger" type="button" aria-label="Open support widget">
        <span class="ticket-widget-icon">💬</span>
        <span class="ticket-widget-text">${this.config.text}</span>
      </button>
    `;

    return button;
  }

  private attachEventListeners(): void {
    const triggerButton = this.element.querySelector('.ticket-widget-trigger') as HTMLButtonElement;
    if (triggerButton) {
      triggerButton.addEventListener('click', this.config.onClick);
    }
  }

  private render(): void {
    document.body.appendChild(this.element);
  }

  public show(): void {
    this.element.classList.remove('ticket-widget-hidden');
    this.element.classList.add('ticket-widget-visible');
    this.element.style.display = 'block';
  }

  public hide(): void {
    this.element.classList.remove('ticket-widget-visible');
    this.element.classList.add('ticket-widget-hidden');
    this.element.style.display = 'none';
  }

  public setText(text: string): void {
    this.config.text = text;
    const textElement = this.element.querySelector('.ticket-widget-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  public destroy(): void {
    this.element.remove();
  }
} 