import { StorageManager } from './storage-manager';

/**
 * Authentication Client for handling login/logout and session management
 * Integrates with the ticket portal's authentication system
 */
export class AuthClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.listeners = [];
    
    console.log('🏗️ [AuthClient] Initializing AuthClient...');
    
    // Initialize state from stored session (use getRawSession to preserve refresh token)
    const storedSession = StorageManager.getRawSession();
    const isAuth = storedSession && !StorageManager.isSessionExpired(storedSession);
    
    console.log('🔍 [AuthClient] Constructor - stored session found:', !!storedSession);
    console.log('🔑 [AuthClient] Constructor - access token present:', !!storedSession?.access_token);
    console.log('🔄 [AuthClient] Constructor - refresh token present:', !!storedSession?.refresh_token);
    console.log('⏰ [AuthClient] Constructor - session expired:', storedSession ? StorageManager.isSessionExpired(storedSession) : 'N/A');
    console.log('🔐 [AuthClient] Constructor - initial auth state:', isAuth ? 'authenticated' : 'not authenticated');
    
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
      console.log('🔍 [AuthClient] Login API response:', JSON.stringify(authData, null, 2));
      
      // Transform MG Tickets API response to match our AuthSession interface
      const session = {
        access_token: authData.session?.accessToken,
        refresh_token: authData.session?.refreshToken,
        expires_at: authData.session?.expiresAt || (Date.now() / 1000) + (24 * 60 * 60), // 24h default if not provided
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.full_name || authData.user?.name,
          avatar_url: authData.user?.avatar_url,
          role: authData.user?.role || 'user'
        }
      };

      console.log('💾 [AuthClient] Session to store:', JSON.stringify(session, null, 2));
      console.log('🔑 [AuthClient] Refresh token present:', !!session.refresh_token);

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

    try {
      // Call API signOut endpoint to properly invalidate session
      const response = await fetch(`${this.baseUrl}/auth/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'signOut'
        })
      });

      // Clear local session regardless of API response
      StorageManager.clearSession();
      
      this.updateState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: null
      });

      if (!response.ok) {
        console.warn('[AuthClient] Server logout failed, but local session cleared');
      }

      return { success: true };

    } catch (error) {
      console.error('[AuthClient] Logout error:', error);
      
      // Clear local session even if API call fails
      StorageManager.clearSession();
      
      this.updateState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: null
      });

      return { success: true }; // Return success since local logout succeeded
    }
  }

  /**
   * Verify/refresh authentication session using MG Tickets API
   */
  async refreshSession() {
    console.log('🔄 [AuthClient] Starting session refresh...');
    
    // Use getRawSession to access refresh token even if access token is expired
    const currentSession = StorageManager.getRawSession();
    if (!currentSession || !currentSession.refresh_token) {
      console.log('❌ [AuthClient] No refresh token available for session refresh');
      return { success: false, error: 'No refresh token available' };
    }

    console.log('🔑 [AuthClient] Found refresh token, calling API refresh endpoint');
    this.updateState({ isLoading: true });

    try {
      // Use MG Tickets Auth refresh endpoint with refresh token
      const response = await fetch(`${this.baseUrl}/auth/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'refresh',
          refreshToken: currentSession.refresh_token
        })
      });

      console.log(`📡 [AuthClient] Refresh API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Session refresh failed: ${response.status}`;
        
        console.log('❌ [AuthClient] Session refresh failed:', errorMessage);
        
        // Refresh failed, clear session
        StorageManager.clearSession();
        
        this.updateState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
          error: 'Session expired'
        });

        console.log('🧹 [AuthClient] Cleared session due to refresh failure');
        return { success: false, error: errorMessage };
      }

      const authData = await response.json();
      console.log('✅ [AuthClient] Session refresh successful, updating tokens');
      
      // Update session with new tokens from refresh response
      const session = {
        access_token: authData.session.accessToken,
        refresh_token: authData.session.refreshToken,
        expires_at: authData.session.expiresAt || (Date.now() / 1000) + (24 * 60 * 60), // 24h default
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.full_name || authData.user?.name,
          avatar_url: authData.user?.avatar_url,
          role: authData.user?.role || 'user'
        }
      };

      StorageManager.storeSession(session);
      console.log('💾 [AuthClient] New session tokens stored successfully');
      console.log('👤 [AuthClient] User still authenticated:', session.user.email);

      this.updateState({
        isLoading: false,
        isAuthenticated: true,
        user: session.user,
        session: session,
        error: null
      });

      console.log('🎉 [AuthClient] Session refresh completed successfully - user remains logged in');
      return { success: true, data: session };

    } catch (error) {
      console.error('💥 [AuthClient] Session refresh error:', error);
      
      StorageManager.clearSession();
      
      this.updateState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: 'Session refresh failed'
      });

      console.log('🧹 [AuthClient] Cleared session due to refresh error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate current session
   */
  async validateSession() {
    console.log('🔍 [AuthClient] Validating current session...');
    
    // First try to get valid session (auto-clears if expired)
    const session = StorageManager.getSession();
    if (session) {
      console.log('✅ [AuthClient] Session is still valid - no refresh needed');
      return true;
    }

    // If no valid session, check for raw session data (may contain refresh token)
    console.log('🔍 [AuthClient] No valid session found, checking for refresh token...');
    const rawSession = StorageManager.getRawSession();
    
    if (!rawSession) {
      console.log('❌ [AuthClient] No session data found at all - validation failed');
      return false;
    }

    // Check if we have a refresh token
    if (!rawSession.refresh_token) {
      console.log('❌ [AuthClient] No refresh token available - clearing expired session');
      StorageManager.clearSession();
      return false;
    }

    console.log('🔑 [AuthClient] Found refresh token, attempting session refresh...');
    
    // Try to refresh using the available refresh token
    const refreshResult = await this.refreshSession();
    
    if (refreshResult.success) {
      console.log('✅ [AuthClient] Session validation successful after refresh');
    } else {
      console.log('❌ [AuthClient] Session validation failed - refresh unsuccessful');
    }
    
    return refreshResult.success;
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