/**
 * Authentication Handler
 * Manages user authentication for the visual feedback modal
 */

import { AuthClient } from '../../utils/auth-client.js';

export default class AuthenticationHandler {
  constructor(options = {}) {
    this.options = options;
    this.authClient = new AuthClient(options.apiUrl);
    this.isAuthenticated = false;
    this.authUnsubscribe = null;
    this.onStateChangeCallback = null;
  }

  /**
   * Initialize authentication
   */
  async initialize() {
    // Setup authentication listener
    this.authUnsubscribe = this.authClient.onStateChange((authState) => {
      this.isAuthenticated = authState.isAuthenticated;
      
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(authState);
      }
    });

    // Initialize auth client
    await this.authClient.initialize();
  }

  /**
   * Set callback for authentication state changes
   */
  onStateChange(callback) {
    this.onStateChangeCallback = callback;
  }

  /**
   * Get current authentication state
   */
  getState() {
    return this.authClient.getState();
  }

  /**
   * Validate current session
   */
  async validateSession() {
    const authState = this.authClient.getState();
    
    // Always attempt validation - even if current state shows not authenticated
    // This allows refresh token recovery when access token expired
    const isValid = await this.authClient.validateSession();
    this.isAuthenticated = isValid;
    
    return isValid;
  }

  /**
   * Handle login
   */
  async handleLogin(credentials) {
    try {
      const result = await this.authClient.login(credentials);
      
      if (result.success) {
        this.isAuthenticated = true;
        
        // Update auth state to notify components
        this.authClient.currentState.isAuthenticated = true;
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during login' };
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      await this.authClient.logout();
      this.isAuthenticated = false;
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during logout' };
    }
  }

  /**
   * Handle session refresh
   */
  async handleRefresh() {
    
    try {
      const result = await this.authClient.refreshSession();
      
      if (result.success) {
        this.isAuthenticated = true;
        
        // Update auth state to notify components
        this.authClient.currentState.isAuthenticated = true;
        return { success: true, data: result.data };
      } else {
        this.isAuthenticated = false;
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.isAuthenticated = false;
      return { success: false, error: 'An unexpected error occurred during session refresh' };
    }
  }

  /**
   * Check if user is authenticated
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Clean up authentication handler
   */
  destroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }
    this.onStateChangeCallback = null;
  }
}