import { createElement } from '../utils/helpers.js';

export class WidgetButton {
  constructor(config) {
    this.config = config;
    this.element = this.createElement();
    this.attachEventListeners();
    this.render();
  }

  createElement() {
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

  attachEventListeners() {
    const triggerButton = this.element.querySelector('.ticket-widget-trigger');
    if (triggerButton) {
      triggerButton.addEventListener('click', this.config.onClick);
    }
  }

  render() {
    document.body.appendChild(this.element);
  }

  show() {
    this.element.classList.remove('ticket-widget-hidden');
    this.element.classList.add('ticket-widget-visible');
    this.element.style.display = 'block';
  }

  hide() {
    this.element.classList.remove('ticket-widget-visible');
    this.element.classList.add('ticket-widget-hidden');
    this.element.style.display = 'none';
  }

  setText(text) {
    this.config.text = text;
    const textElement = this.element.querySelector('.ticket-widget-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  destroy() {
    this.element.remove();
  }
}