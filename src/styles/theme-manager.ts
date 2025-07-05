import { ThemeConfig, ThemeType } from '@/core/types';

export class ThemeManager {
  private currentTheme: ThemeType;
  private themes: Map<ThemeType, ThemeConfig> = new Map();
  private styleElement: HTMLStyleElement | null = null;

  constructor(theme: ThemeType = 'default') {
    this.currentTheme = theme;
    this.loadDefaultThemes();
    this.createStyleElement();
  }

  private loadDefaultThemes(): void {
    // Default theme
    this.themes.set('default', {
      name: 'Default',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      }
    });

    // Modern theme
    this.themes.set('modern', {
      name: 'Modern',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        background: '#ffffff',
        text: '#111827',
        textLight: '#6b7280',
        border: '#f3f4f6',
        success: '#059669',
        error: '#dc2626',
        warning: '#d97706'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem'
      },
      shadows: {
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      }
    });

    // Minimal theme
    this.themes.set('minimal', {
      name: 'Minimal',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#000000',
        textLight: '#666666',
        border: '#e0e0e0',
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        lg: '0 4px 8px 0 rgba(0, 0, 0, 0.1)'
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      }
    });

    // Dark theme
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#1f2937',
        text: '#f9fafb',
        textLight: '#d1d5db',
        border: '#374151',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.25)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.25)'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      }
    });
  }

  private createStyleElement(): void {
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'ticket-widget-theme';
    document.head.appendChild(this.styleElement);
  }

  async loadTheme(theme: ThemeType): Promise<void> {
    this.currentTheme = theme;
    await this.applyTheme();
  }

  setTheme(theme: ThemeType): void {
    this.loadTheme(theme);
  }

  private async applyTheme(): Promise<void> {
    const theme = this.themes.get(this.currentTheme);
    if (!theme) {
      console.warn(`Theme ${this.currentTheme} not found`);
      return;
    }

    const css = this.generateCSS(theme);
    if (this.styleElement) {
      this.styleElement.textContent = css;
    }
  }

  private generateCSS(theme: ThemeConfig): string {
    return `
      :root {
        /* Colors */
        --tw-color-primary: ${theme.colors.primary};
        --tw-color-secondary: ${theme.colors.secondary};
        --tw-color-background: ${theme.colors.background};
        --tw-color-text: ${theme.colors.text};
        --tw-color-text-light: ${theme.colors.textLight};
        --tw-color-border: ${theme.colors.border};
        --tw-color-success: ${theme.colors.success};
        --tw-color-error: ${theme.colors.error};
        --tw-color-warning: ${theme.colors.warning};
        
        /* Spacing */
        --tw-spacing-xs: ${theme.spacing.xs};
        --tw-spacing-sm: ${theme.spacing.sm};
        --tw-spacing-md: ${theme.spacing.md};
        --tw-spacing-lg: ${theme.spacing.lg};
        --tw-spacing-xl: ${theme.spacing.xl};
        
        /* Border Radius */
        --tw-radius-sm: ${theme.borderRadius.sm};
        --tw-radius-md: ${theme.borderRadius.md};
        --tw-radius-lg: ${theme.borderRadius.lg};
        
        /* Shadows */
        --tw-shadow-sm: ${theme.shadows.sm};
        --tw-shadow-md: ${theme.shadows.md};
        --tw-shadow-lg: ${theme.shadows.lg};
        
        /* Typography */
        --tw-font-family: ${theme.typography.fontFamily};
        --tw-font-size-xs: ${theme.typography.fontSize.xs};
        --tw-font-size-sm: ${theme.typography.fontSize.sm};
        --tw-font-size-md: ${theme.typography.fontSize.md};
        --tw-font-size-lg: ${theme.typography.fontSize.lg};
        --tw-font-size-xl: ${theme.typography.fontSize.xl};
        --tw-font-weight-normal: ${theme.typography.fontWeight.normal};
        --tw-font-weight-medium: ${theme.typography.fontWeight.medium};
        --tw-font-weight-semibold: ${theme.typography.fontWeight.semibold};
        --tw-font-weight-bold: ${theme.typography.fontWeight.bold};
      }
    `;
  }

  getCurrentTheme(): ThemeType {
    return this.currentTheme;
  }

  getTheme(theme: ThemeType): ThemeConfig | undefined {
    return this.themes.get(theme);
  }

  getSupportedThemes(): ThemeType[] {
    return Array.from(this.themes.keys());
  }

  addTheme(theme: ThemeType, config: ThemeConfig): void {
    this.themes.set(theme, config);
  }

  extendTheme(theme: ThemeType, config: Partial<ThemeConfig>): void {
    const existing = this.themes.get(theme);
    if (existing) {
      this.themes.set(theme, { ...existing, ...config });
    }
  }

  destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
} 