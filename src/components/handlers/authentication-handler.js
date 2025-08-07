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
    
    if (authState.isAuthenticated) {
      const isValid = await this.authClient.validateSession();
      this.isAuthenticated = isValid;
      return isValid;
    }
    
    this.isAuthenticated = false;
    return false;
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
        console.error('[AuthenticationHandler] Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[AuthenticationHandler] Login error:', error);
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
      console.error('[AuthenticationHandler] Logout error:', error);
      return { success: false, error: 'An error occurred during logout' };
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