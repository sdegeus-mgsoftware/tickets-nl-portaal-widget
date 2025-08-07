/**
 * Example: Creating tickets from the widget using the portaal API
 */

import { ApiClient } from '../src/core/api-client.js';
import { AuthClient } from '../src/utils/auth-client.js';
import { MetadataCollector } from '../src/utils/metadata-collector.js';

// Configuration
const config = {
  apiUrl: 'https://your-portaal-domain.com/api', // Update with your portaal URL
  projectId: 'your-project-id', // Optional: default project
  organizationId: 'your-organization-id' // Optional: default organization
};

// Initialize API client
const apiClient = new ApiClient(config);
const authClient = new AuthClient(config.apiUrl);

// Example 1: Create a ticket with user authentication
async function createTicketExample() {
  try {
    // First, ensure user is authenticated
    const authState = authClient.getState();
    if (!authState.isAuthenticated) {
      console.log('User must be authenticated to create tickets');
      // Trigger login flow here
      return;
    }

    // Prepare ticket data
    const ticketData = {
      title: 'Bug report from widget',
      description: 'User reported an issue through the feedback widget',
      priority: 'medium', // low, medium, high, urgent
      category: 'bug', // bug, feature, task, question
      // organization_id: 'org_12345', // Optional: will use config.organizationId if not provided
      requester_id: authState.user.id, // Required: authenticated user's ID
      project_id: config.projectId, // Optional: will use default if not provided
      assignee_id: null, // Optional: assign to specific user
      metadata: { // Optional: custom metadata
        created_from: 'feedback_widget',
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        widget_version: '1.0.0'
      }
    };

    // Create the ticket
    const result = await apiClient.createTicket(ticketData);
    
    if (result.success) {
      console.log('Ticket created successfully:', result.data);
      return result.data.ticket;
    } else {
      console.error('Failed to create ticket:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}

// Example 2: Create ticket with form data
async function createTicketFromForm(formData) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in to create tickets');
  }

  const ticketData = {
    title: formData.title,
    description: formData.description,
    priority: formData.priority || 'medium',
    category: formData.category || 'question',
    organization_id: authState.user.organization_id, // Assuming user has org context
    requester_id: authState.user.id
  };

  return await apiClient.createTicket(ticketData);
}

// Example 3: Handle ticket creation in widget component
class TicketCreationWidget {
  constructor(config) {
    this.apiClient = new ApiClient(config);
    this.authClient = new AuthClient(config.apiUrl);
  }

  async submitFeedback(feedbackData) {
    try {
      // Check authentication
      const authState = this.authClient.getState();
      if (!authState.isAuthenticated) {
        // Redirect to login or show login modal
        this.showLoginPrompt();
        return;
      }

      // Prepare ticket from feedback
      const ticketData = {
        title: feedbackData.subject || 'Feedback from widget',
        description: this.formatFeedbackDescription(feedbackData),
        priority: this.mapUrgencyToPriority(feedbackData.urgency),
        category: 'task',
        organization_id: this.getOrganizationId(),
        requester_id: authState.user.id
      };

      // Create ticket
      const result = await this.apiClient.createTicket(ticketData);
      
      if (result.success) {
        this.showSuccessMessage(`Ticket ${result.data.ticket.ticket_number} created!`);
        this.onTicketCreated(result.data.ticket);
      } else {
        this.showErrorMessage(result.error.message);
      }
    } catch (error) {
      console.error('Widget ticket creation error:', error);
      this.showErrorMessage('Failed to create ticket');
    }
  }

  formatFeedbackDescription(feedbackData) {
    let description = feedbackData.description || '';
    
    // Add system info if available
    if (feedbackData.systemInfo) {
      description += '\n\n--- System Information ---\n';
      description += `Browser: ${feedbackData.systemInfo.browser}\n`;
      description += `OS: ${feedbackData.systemInfo.os}\n`;
      description += `URL: ${feedbackData.systemInfo.url}\n`;
    }

    // Add steps to reproduce if available
    if (feedbackData.steps && feedbackData.steps.length > 0) {
      description += '\n\n--- Steps to Reproduce ---\n';
      feedbackData.steps.forEach((step, index) => {
        description += `${index + 1}. ${step}\n`;
      });
    }

    return description;
  }

  mapUrgencyToPriority(urgency) {
    const urgencyMap = {
      'low': 'low',
      'normal': 'medium', 
      'high': 'high',
      'critical': 'urgent'
    };
    return urgencyMap[urgency] || 'medium';
  }

  getOrganizationId() {
    // Use configured organization ID or get from user context
    const authState = this.authClient.getState();
    return this.apiClient.getOrganizationId() || 
           authState.user?.organization_id || 
           this.config.defaultOrganizationId;
  }

  showLoginPrompt() {
    // Implementation depends on your widget UI
    console.log('Please log in to create a ticket');
  }

  showSuccessMessage(message) {
    // Implementation depends on your widget UI
    console.log('Success:', message);
  }

  showErrorMessage(message) {
    // Implementation depends on your widget UI
    console.error('Error:', message);
  }

  onTicketCreated(ticket) {
    // Custom callback when ticket is created
    console.log('Ticket created callback:', ticket);
  }
}

// Example 4: Dynamic organization configuration
function configureWidgetForOrganization(organizationId) {
  // Set organization ID dynamically
  apiClient.setOrganizationId(organizationId);
  
  console.log('Widget configured for organization:', apiClient.getOrganizationId());
}

// Example 5: Create ticket with minimal data (using config defaults)
async function createMinimalTicket(title, description) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in');
  }

  // Only pass required fields - organization comes from config
  const ticketData = {
    title,
    description,
    requester_id: authState.user.id
    // organization_id and project_id will use config defaults
  };

  return await apiClient.createTicket(ticketData);
}

// Example 6: Using metadata for tracking and context
async function createTicketWithMetadata(ticketInfo) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in');
  }

  const ticketData = {
    title: ticketInfo.title,
    description: ticketInfo.description,
    requester_id: authState.user.id,
    metadata: {
      // Widget context
      created_from: 'widget',
      widget_version: '1.2.0',
      
      // User context
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      
      // Issue context
      error_code: ticketInfo.errorCode,
      steps_taken: ticketInfo.stepsTaken,
      browser_console_errors: ticketInfo.consoleErrors,
      
      // Custom tracking
      session_id: ticketInfo.sessionId,
      feature_flags: ticketInfo.activeFeatures,
      timestamp: new Date().toISOString()
    }
  };

  return await apiClient.createTicket(ticketData);
}

// Example 7: COMPREHENSIVE metadata collection - captures EVERYTHING
async function createTicketWithFullMetadata(ticketInfo) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in');
  }

  console.log('🔍 Collecting comprehensive metadata...');
  
  // Collect ALL available metadata
  const comprehensiveMetadata = await MetadataCollector.collectAll();
  
  // Add ticket-specific context
  const ticketData = {
    title: ticketInfo.title,
    description: ticketInfo.description,
    priority: ticketInfo.priority || 'medium',
            category: ticketInfo.category || 'task',
    requester_id: authState.user.id,
    metadata: {
      // All the comprehensive system metadata
      ...comprehensiveMetadata,
      
      // Ticket-specific metadata
      ticket_context: {
        user_input: {
          title: ticketInfo.title,
          description: ticketInfo.description,
          category: ticketInfo.category,
          priority: ticketInfo.priority,
          urgency: ticketInfo.urgency,
          tags: ticketInfo.tags || []
        },
        
        // Form interaction data
        form_data: {
          time_to_fill: ticketInfo.timeToFill,
          fields_changed: ticketInfo.fieldsChanged || 0,
          backspace_count: ticketInfo.backspaceCount || 0,
          paste_events: ticketInfo.pasteEvents || 0,
          focus_time: ticketInfo.focusTime || 0
        },
        
        // User journey
        user_journey: {
          pages_visited: ticketInfo.pagesVisited || [],
          time_on_page: ticketInfo.timeOnPage || 0,
          scroll_depth: ticketInfo.maxScrollDepth || 0,
          clicks_before_widget: ticketInfo.clicksBeforeWidget || 0,
          widget_open_method: ticketInfo.widgetOpenMethod || 'click'
        },
        
        // Issue context
        issue_context: {
          error_occurred: ticketInfo.errorOccurred || false,
          error_message: ticketInfo.errorMessage,
          steps_to_reproduce: ticketInfo.stepsToReproduce || [],
          expected_behavior: ticketInfo.expectedBehavior,
          actual_behavior: ticketInfo.actualBehavior,
          frequency: ticketInfo.frequency || 'once',
          first_occurrence: ticketInfo.firstOccurrence
        },
        
        // Attachments info
        attachments: {
          count: ticketInfo.attachments?.length || 0,
          types: ticketInfo.attachments?.map(a => a.type) || [],
          total_size: ticketInfo.attachments?.reduce((sum, a) => sum + a.size, 0) || 0,
          screenshots_included: ticketInfo.screenshots?.length || 0
        }
      }
    }
  };

  console.log('📊 Metadata size:', JSON.stringify(ticketData.metadata).length, 'bytes');
  console.log('🎯 Creating ticket with full context...');

  return await apiClient.createTicket(ticketData);
}

// Example 8: Smart metadata - only collect what's needed based on issue type
async function createSmartTicket(ticketInfo) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in');
  }

  let metadata = {
    // Always include basics
    widget: {
      version: '1.2.0',
      created_from: 'smart_widget',
      timestamp: new Date().toISOString()
    },
    page: {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer
    },
    browser: {
      user_agent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    }
  };

  // Add specific metadata based on issue type
  switch (ticketInfo.category) {
    case 'bug':
      // For bugs, collect technical details
      const fullMetadata = await MetadataCollector.collectAll();
      metadata = {
        ...metadata,
        system: fullMetadata.system,
        browser: fullMetadata.browser,
        performance: fullMetadata.performance,
        errors: fullMetadata.errors,
        environment: fullMetadata.environment
      };
      break;
      
    case 'feature':
      // For features, focus on user context
      metadata.user_context = {
        screen: {
          width: screen.width,
          height: screen.height
        },
        usage_pattern: ticketInfo.usagePattern || 'unknown'
      };
      break;
      
    case 'question':
      // For questions, minimal metadata
      metadata.question_context = {
        section: ticketInfo.section || 'general',
        help_tried: ticketInfo.helpTried || false
      };
      break;
      
    default:
      // For other types, basic metadata
      break;
  }

  const ticketData = {
    title: ticketInfo.title,
    description: ticketInfo.description,
    category: ticketInfo.category,
    priority: ticketInfo.priority || 'medium',
    requester_id: authState.user.id,
    metadata
  };

  return await apiClient.createTicket(ticketData);
}

// Example 9: Performance-optimized metadata collection
async function createTicketWithOptimizedMetadata(ticketInfo) {
  const authState = authClient.getState();
  
  if (!authState.isAuthenticated) {
    throw new Error('User must be logged in');
  }

  // Collect metadata in parallel for better performance
  const [
    pageContext,
    browserInfo,
    systemInfo,
    displayInfo
  ] = await Promise.all([
    Promise.resolve(MetadataCollector.getPageContext()),
    Promise.resolve(MetadataCollector.getBrowserInfo()),
    Promise.resolve(MetadataCollector.getSystemInfo()),
    Promise.resolve(MetadataCollector.getDisplayInfo())
  ]);

  const ticketData = {
    title: ticketInfo.title,
    description: ticketInfo.description,
    requester_id: authState.user.id,
    metadata: {
      collection_method: 'performance_optimized',
      timestamp: new Date().toISOString(),
      page: pageContext,
      browser: browserInfo,
      system: systemInfo,
      display: displayInfo,
      
      // Quick user context
      user_context: {
        time_on_page: ticketInfo.timeOnPage || 0,
        interaction_count: ticketInfo.interactionCount || 0,
        widget_trigger: ticketInfo.widgetTrigger || 'manual'
      }
    }
  };

  return await apiClient.createTicket(ticketData);
}

// Example 10: Real-time metadata updates during form filling
class RealTimeMetadataWidget {
  constructor(apiClient, authClient) {
    this.apiClient = apiClient;
    this.authClient = authClient;
    this.metadata = {
      form_interactions: [],
      start_time: Date.now(),
      field_focus_times: {},
      typing_patterns: []
    };
    
    this.setupFormTracking();
  }

  setupFormTracking() {
    // Track form field interactions
    document.addEventListener('focusin', this.onFieldFocus.bind(this));
    document.addEventListener('focusout', this.onFieldBlur.bind(this));
    document.addEventListener('input', this.onFieldInput.bind(this));
    document.addEventListener('paste', this.onPaste.bind(this));
  }

  onFieldFocus(event) {
    const field = event.target;
    if (this.isFormField(field)) {
      this.metadata.field_focus_times[field.name || field.id] = Date.now();
      this.metadata.form_interactions.push({
        type: 'focus',
        field: field.name || field.id,
        timestamp: Date.now()
      });
    }
  }

  onFieldBlur(event) {
    const field = event.target;
    if (this.isFormField(field)) {
      const focusTime = this.metadata.field_focus_times[field.name || field.id];
      if (focusTime) {
        this.metadata.form_interactions.push({
          type: 'blur',
          field: field.name || field.id,
          duration: Date.now() - focusTime,
          timestamp: Date.now()
        });
      }
    }
  }

  onFieldInput(event) {
    const field = event.target;
    if (this.isFormField(field)) {
      this.metadata.typing_patterns.push({
        field: field.name || field.id,
        length: field.value.length,
        timestamp: Date.now()
      });
    }
  }

  onPaste(event) {
    this.metadata.form_interactions.push({
      type: 'paste',
      timestamp: Date.now(),
      data_length: event.clipboardData?.getData('text')?.length || 0
    });
  }

  isFormField(element) {
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
  }

  async createTicketWithRealTimeData(ticketInfo) {
    const authState = this.authClient.getState();
    
    if (!authState.isAuthenticated) {
      throw new Error('User must be logged in');
    }

    // Get comprehensive metadata + real-time form data
    const comprehensiveMetadata = await MetadataCollector.collectAll();
    
    const ticketData = {
      title: ticketInfo.title,
      description: ticketInfo.description,
      requester_id: authState.user.id,
      metadata: {
        ...comprehensiveMetadata,
        
        // Real-time form interaction data
        form_analytics: {
          ...this.metadata,
          total_time: Date.now() - this.metadata.start_time,
          completion_time: Date.now(),
          
          // Calculated metrics
          avg_typing_speed: this.calculateTypingSpeed(),
          field_completion_order: this.getFieldCompletionOrder(),
          hesitation_points: this.getHesitationPoints()
        }
      }
    };

    return await this.apiClient.createTicket(ticketData);
  }

  calculateTypingSpeed() {
    if (this.metadata.typing_patterns.length < 2) return 0;
    
    const patterns = this.metadata.typing_patterns;
    const totalTime = patterns[patterns.length - 1].timestamp - patterns[0].timestamp;
    const totalChars = patterns[patterns.length - 1].length;
    
    return totalTime > 0 ? (totalChars / totalTime) * 1000 * 60 : 0; // chars per minute
  }

  getFieldCompletionOrder() {
    const focusEvents = this.metadata.form_interactions.filter(i => i.type === 'focus');
    return focusEvents.map(e => e.field);
  }

  getHesitationPoints() {
    // Find long pauses in typing
    const hesitations = [];
    const patterns = this.metadata.typing_patterns;
    
    for (let i = 1; i < patterns.length; i++) {
      const timeDiff = patterns[i].timestamp - patterns[i-1].timestamp;
      if (timeDiff > 3000) { // 3+ second pause
        hesitations.push({
          field: patterns[i].field,
          pause_duration: timeDiff,
          timestamp: patterns[i].timestamp
        });
      }
    }
    
    return hesitations;
  }
}

// Export for use in your widget
export { 
  createTicketExample, 
  createTicketFromForm, 
  TicketCreationWidget,
  configureWidgetForOrganization,
  createMinimalTicket,
  createTicketWithMetadata,
  createTicketWithFullMetadata,
  createSmartTicket,
  createTicketWithOptimizedMetadata,
  RealTimeMetadataWidget
};