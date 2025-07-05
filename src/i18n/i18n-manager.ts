import { I18nMessages, LanguageType } from '@/core/types';

export class I18nManager {
  private currentLanguage: LanguageType;
  private messages: Map<LanguageType, I18nMessages> = new Map();
  private fallbackLanguage: LanguageType = 'en';

  constructor(language: LanguageType = 'en') {
    this.currentLanguage = language;
    this.loadDefaultMessages();
  }

  private loadDefaultMessages(): void {
    // English messages
    this.messages.set('en', {
      button: {
        help: 'Need Help?',
        close: 'Close',
        send: 'Send Message',
        cancel: 'Cancel',
        upload: 'Upload File',
        remove: 'Remove'
      },
      form: {
        name: 'Name',
        email: 'Email',
        subject: 'Subject',
        message: 'Message',
        category: 'Category',
        priority: 'Priority',
        phone: 'Phone',
        company: 'Company'
      },
      placeholder: {
        name: 'Enter your name',
        email: 'Enter your email',
        subject: 'What can we help you with?',
        message: 'Please describe your issue...',
        phone: 'Enter your phone number',
        company: 'Enter your company name'
      },
      validation: {
        name_required: 'Name is required',
        email_required: 'Email is required',
        email_invalid: 'Please enter a valid email address',
        subject_required: 'Subject is required',
        message_required: 'Message is required',
        file_too_large: 'File is too large',
        file_type_not_allowed: 'File type is not allowed'
      },
      success: {
        ticket_created: 'Your ticket has been created successfully!',
        ticket_number: 'Ticket Number',
        will_contact: 'We will contact you soon.'
      },
      error: {
        general: 'Something went wrong. Please try again.',
        network: 'Network error. Please check your connection.',
        upload_failed: 'File upload failed',
        rate_limited: 'Too many requests. Please try again later.'
      },
      upload: {
        drop_zone: 'Drop files here or click to upload',
        max_size: 'Max file size',
        allowed_types: 'Allowed file types'
      }
    });

    // Dutch messages
    this.messages.set('nl', {
      button: {
        help: 'Hulp nodig?',
        close: 'Sluiten',
        send: 'Bericht verzenden',
        cancel: 'Annuleren',
        upload: 'Bestand uploaden',
        remove: 'Verwijderen'
      },
      form: {
        name: 'Naam',
        email: 'E-mail',
        subject: 'Onderwerp',
        message: 'Bericht',
        category: 'Categorie',
        priority: 'Prioriteit',
        phone: 'Telefoon',
        company: 'Bedrijf'
      },
      placeholder: {
        name: 'Voer uw naam in',
        email: 'Voer uw e-mailadres in',
        subject: 'Waarmee kunnen we u helpen?',
        message: 'Beschrijf uw probleem...',
        phone: 'Voer uw telefoonnummer in',
        company: 'Voer uw bedrijfsnaam in'
      },
      validation: {
        name_required: 'Naam is verplicht',
        email_required: 'E-mail is verplicht',
        email_invalid: 'Voer een geldig e-mailadres in',
        subject_required: 'Onderwerp is verplicht',
        message_required: 'Bericht is verplicht',
        file_too_large: 'Bestand is te groot',
        file_type_not_allowed: 'Bestandstype is niet toegestaan'
      },
      success: {
        ticket_created: 'Uw ticket is succesvol aangemaakt!',
        ticket_number: 'Ticketnummer',
        will_contact: 'We nemen binnenkort contact met u op.'
      },
      error: {
        general: 'Er is iets misgegaan. Probeer het opnieuw.',
        network: 'Netwerkfout. Controleer uw verbinding.',
        upload_failed: 'Bestand uploaden mislukt',
        rate_limited: 'Te veel verzoeken. Probeer het later opnieuw.'
      },
      upload: {
        drop_zone: 'Sleep bestanden hier of klik om te uploaden',
        max_size: 'Maximale bestandsgrootte',
        allowed_types: 'Toegestane bestandstypen'
      }
    });

    // German messages
    this.messages.set('de', {
      button: {
        help: 'Hilfe benötigt?',
        close: 'Schließen',
        send: 'Nachricht senden',
        cancel: 'Abbrechen',
        upload: 'Datei hochladen',
        remove: 'Entfernen'
      },
      form: {
        name: 'Name',
        email: 'E-Mail',
        subject: 'Betreff',
        message: 'Nachricht',
        category: 'Kategorie',
        priority: 'Priorität',
        phone: 'Telefon',
        company: 'Unternehmen'
      },
      placeholder: {
        name: 'Geben Sie Ihren Namen ein',
        email: 'Geben Sie Ihre E-Mail-Adresse ein',
        subject: 'Womit können wir Ihnen helfen?',
        message: 'Beschreiben Sie Ihr Problem...',
        phone: 'Geben Sie Ihre Telefonnummer ein',
        company: 'Geben Sie Ihren Firmennamen ein'
      },
      validation: {
        name_required: 'Name ist erforderlich',
        email_required: 'E-Mail ist erforderlich',
        email_invalid: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        subject_required: 'Betreff ist erforderlich',
        message_required: 'Nachricht ist erforderlich',
        file_too_large: 'Datei ist zu groß',
        file_type_not_allowed: 'Dateityp ist nicht erlaubt'
      },
      success: {
        ticket_created: 'Ihr Ticket wurde erfolgreich erstellt!',
        ticket_number: 'Ticketnummer',
        will_contact: 'Wir werden Sie bald kontaktieren.'
      },
      error: {
        general: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
        network: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
        upload_failed: 'Datei-Upload fehlgeschlagen',
        rate_limited: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
      },
      upload: {
        drop_zone: 'Dateien hier ablegen oder klicken zum Hochladen',
        max_size: 'Maximale Dateigröße',
        allowed_types: 'Erlaubte Dateitypen'
      }
    });
  }

  async loadLanguage(language: LanguageType): Promise<void> {
    this.currentLanguage = language;
    
    // In a real implementation, you might load language files dynamically
    // For now, we use the pre-loaded messages
    if (!this.messages.has(language)) {
      console.warn(`Language ${language} not found, falling back to ${this.fallbackLanguage}`);
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  t(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.messages.get(this.currentLanguage);
    
    // Try to find the key in the current language
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    
    // If not found, try fallback language
    if (!value) {
      value = this.messages.get(this.fallbackLanguage);
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = key; // Return the key if not found
          break;
        }
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, replacement]) => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
      });
    }
    
    return value;
  }

  setLanguage(language: LanguageType): void {
    this.loadLanguage(language);
  }

  getCurrentLanguage(): LanguageType {
    return this.currentLanguage;
  }

  getSupportedLanguages(): LanguageType[] {
    return Array.from(this.messages.keys());
  }

  addMessages(language: LanguageType, messages: I18nMessages): void {
    this.messages.set(language, messages);
  }

  extendMessages(language: LanguageType, messages: I18nMessages): void {
    const existing = this.messages.get(language) || {};
    this.messages.set(language, { ...existing, ...messages });
  }
} 