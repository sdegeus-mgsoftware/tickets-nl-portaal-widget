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
    console.log('🔍 [AuthenticationHandler] Validating session...');
    
    const authState = this.authClient.getState();
    console.log('🔐 [AuthenticationHandler] Current auth state:', authState.isAuthenticated ? 'authenticated' : 'not authenticated');
    
    // Always attempt validation - even if current state shows not authenticated
    // This allows refresh token recovery when access token expired
    console.log('🔍 [AuthenticationHandler] Delegating session validation to AuthClient...');
    const isValid = await this.authClient.validateSession();
    this.isAuthenticated = isValid;
    
    if (isValid) {
      console.log('✅ [AuthenticationHandler] Session validation successful');
    } else {
      console.log('❌ [AuthenticationHandler] Session validation failed - no valid session or refresh token');
    }
    
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
   * Handle session refresh
   */
  async handleRefresh() {
    console.log('🔄 [AuthenticationHandler] Handling session refresh request...');
    
    try {
      const result = await this.authClient.refreshSession();
      
      if (result.success) {
        console.log('✅ [AuthenticationHandler] Session refresh successful');
        console.log('👤 [AuthenticationHandler] User remains authenticated:', result.data?.user?.email);
        
        this.isAuthenticated = true;
        
        // Update auth state to notify components
        this.authClient.currentState.isAuthenticated = true;
        
        console.log('🔔 [AuthenticationHandler] Auth state updated - components notified');
        return { success: true, data: result.data };
      } else {
        console.error('❌ [AuthenticationHandler] Session refresh failed:', result.error);
        this.isAuthenticated = false;
        console.log('🔓 [AuthenticationHandler] User is no longer authenticated');
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('💥 [AuthenticationHandler] Refresh error:', error);
      this.isAuthenticated = false;
      console.log('🔓 [AuthenticationHandler] User is no longer authenticated due to error');
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