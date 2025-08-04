import { StorageManager } from './storage-manager';

/**
 * Authentication Client for handling login/logout and session management
 * Integrates with the ticket portal's authentication system
 */
export class AuthClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.listeners = [];
    
    // Initialize state from stored session
    const storedSession = StorageManager.getSession();
    const isAuth = StorageManager.isAuthenticated();
    
    this.currentState = {
      isAuthenticated: isAuth,
      isLoading: false,
      user: storedSession?.user || null,
      session: storedSession,
      error: null
    };
    

  }

  /**
   * Get current authentication state
   */
  getState() {
    return { ...this.currentState };
  }

  /**
   * Validate current session and refresh if needed
   */
  async validateSession() {
    const accessToken = StorageManager.getAccessToken();
    if (!accessToken) {
      this.currentState.isAuthenticated = false;
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/external`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.currentState.isAuthenticated = true;
        this.currentState.user = data.user;
        return true;
      } else {
        this.currentState.isAuthenticated = false;
        StorageManager.clearSession();
        return false;
      }
    } catch (error) {
      console.error('[AuthClient] Session validation error:', error);
      this.currentState.isAuthenticated = false;
      StorageManager.clearSession();
      return false;
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onStateChange(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update state and notify listeners
   */
  updateState(newState) {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Login with email and password using MG Tickets API
   */
  async login(credentials) {
    this.updateState({ isLoading: true, error: null });

    try {
      // Use MG Tickets Auth endpoint
      const response = await fetch(`${this.baseUrl}/auth/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'signIn',
          email: credentials.email,
          password: credentials.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Login failed: ${response.status}`;
        
        this.updateState({ 
          isLoading: false, 
          error: errorMessage,
          isAuthenticated: false,
          user: null,
          session: null
        });

        return { success: false, error: errorMessage };
      }

      const authData = await response.json();
      
      // Transform MG Tickets API response to match our AuthSession interface
      const session = {
        access_token: authData.session.accessToken,
        refresh_token: authData.session.refreshToken,
        expires_at: authData.session.expiresAt || (Date.now() / 1000) + (24 * 60 * 60), // 24h default if not provided
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.full_name || authData.user?.name,
          avatar_url: authData.user?.avatar_url,
          role: authData.user?.role || 'user'
        }
      };

      // Store session
      const stored = StorageManager.storeSession(session);
      if (!stored) {
        console.warn('[AuthClient] Failed to store session in localStorage');
      }

      this.updateState({
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        session: session,
        error: null
      });

      return { success: true, data: session };

    } catch (error) {
      const errorMessage = error.message || 'Network error during login';
      
      this.updateState({ 
        isLoading: false, 
        error: errorMessage,
        isAuthenticated: false,
        user: null,
        session: null
      });

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Logout and clear session
   */
  async logout() {
    this.updateState({ isLoading: true });

    // Clear local session (MG Tickets API doesn't require server logout call)
    StorageManager.clearSession();
    
    this.updateState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      session: null,
      error: null
    });


  }

  /**
   * Verify/refresh authentication session using MG Tickets API
   */
  async refreshSession() {
    const accessToken = StorageManager.getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'No access token available' };
    }

    this.updateState({ isLoading: true });

    try {
      // Use MG Tickets Auth verification endpoint
      const response = await fetch(`${this.baseUrl}/auth/external`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        // Refresh failed, clear session
        StorageManager.clearSession();
        
        this.updateState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
          error: 'Session expired'
        });

        return { success: false, error: 'Session refresh failed' };
      }

      const authData = await response.json();
      
      // Keep current session tokens, just update user data from verification
      const currentSession = StorageManager.getSession();
      const session = {
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token,
        expires_at: currentSession.expires_at,
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.full_name || authData.user?.name,
          avatar_url: authData.user?.avatar_url,
          role: authData.user?.role || 'user'
        }
      };

      StorageManager.storeSession(session);

      this.updateState({
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        session: session,
        error: null
      });

      return { success: true, data: session };

    } catch (error) {
      StorageManager.clearSession();
      
      this.updateState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: 'Session refresh failed'
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Validate current session
   */
  async validateSession() {
    const session = StorageManager.getSession();
    if (!session) {
      return false;
    }

    // Check if token is expired
    if (StorageManager.isSessionExpired(session)) {
      // Try to refresh
      const refreshResult = await this.refreshSession();
      return refreshResult.success;
    }

    return true;
  }

  /**
   * Get current access token
   */
  getAccessToken() {
    return StorageManager.getAccessToken();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return StorageManager.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return StorageManager.isAuthenticated();
  }

  /**
   * Initialize and validate session on startup
   */
  async initialize() {
    const isValid = await this.validateSession();
    
    if (!isValid) {
      this.updateState({
        isAuthenticated: false,
        user: null,
        session: null,
        error: null
      });
    }
  }
}