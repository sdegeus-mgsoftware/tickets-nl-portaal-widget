import { TicketWidget } from '@/core/widget';
import { WidgetConfig } from '@/core/types';
import '@/styles/main.scss';

// Export the main widget class
export { TicketWidget };
export * from '@/core/types';

// Auto-initialize from data attributes
document.addEventListener('DOMContentLoaded', () => {
  const scripts = document.querySelectorAll('script[data-api-key]');
  
  scripts.forEach(script => {
    const config: WidgetConfig = {
      apiKey: script.getAttribute('data-api-key') || '',
      orgId: script.getAttribute('data-org-id') || '',
      apiUrl: script.getAttribute('data-api-url') || undefined,
      theme: script.getAttribute('data-theme') as any || 'default',
      position: script.getAttribute('data-position') as any || 'bottom-right',
      buttonText: script.getAttribute('data-button-text') || undefined,
      language: script.getAttribute('data-language') as any || 'en',
      allowedDomains: script.getAttribute('data-allowed-domains')?.split(',') || [],
      showBranding: script.getAttribute('data-show-branding') !== 'false',
      customStyles: script.getAttribute('data-custom-styles') || undefined,
      maxFileSize: parseInt(script.getAttribute('data-max-file-size') || '10485760'), // 10MB
      allowedFileTypes: script.getAttribute('data-allowed-file-types')?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain'
      ]
    };
    
    if (config.apiKey && config.orgId) {
      new TicketWidget(config);
    } else {
      console.warn('TicketWidget: Missing required configuration (apiKey or orgId)');
    }
  });
});

// Make it available globally
(window as any).TicketWidget = TicketWidget;

// Export as default for UMD builds
export default TicketWidget; 