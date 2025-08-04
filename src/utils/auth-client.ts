import { LoginCredentials, AuthResponse, AuthSession, AuthState, AuthUser } from '@/core/types';
import { StorageManager } from './storage-manager';

/**
 * Authentication Client for handling login/logout and session management
 * Integrates with the ticket portal's authentication system
 */
export class AuthClient {
  private baseUrl: string;
  private listeners: Array<(state: AuthState) => void> = [];
  private currentState: AuthState;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    
    // Initialize state from stored session
    const storedSession = StorageManager.getSession();
    this.currentState = {
      isAuthenticated: StorageManager.isAuthenticated(),
      isLoading: false,
      user: storedSession?.user || null,
      session: storedSession,
      error: null
    };
  }

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to authentication state changes
   */
  onStateChange(listener: (state: AuthState) => void): () => void {
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
  private updateState(newState: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.listeners.forEach(listener => listener(this.currentState));
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateState({ isLoading: true, error: null });

    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Widget-Origin': window.location.origin
        },
        body: JSON.stringify(credentials)
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
      
      // Transform response to match our AuthSession interface
      const session: AuthSession = {
        access_token: authData.access_token || authData.session?.access_token,
        refresh_token: authData.refresh_token || authData.session?.refresh_token,
        expires_at: authData.expires_at || authData.session?.expires_at || (Date.now() / 1000) + (24 * 60 * 60), // 24h default
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          full_name: authData.user?.user_metadata?.full_name || authData.user?.full_name,
          avatar_url: authData.user?.user_metadata?.avatar_url || authData.user?.avatar_url,
          role: authData.user?.user_metadata?.role || authData.user?.role
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

    } catch (error: any) {
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
  async logout(): Promise<void> {
    this.updateState({ isLoading: true });

    try {
      // Try to notify server about logout (best effort)
      const session = StorageManager.getSession();
      if (session?.access_token) {
        await fetch(`${this.baseUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }).catch(() => {
          // Ignore errors - we'll clear local session anyway
        });
      }
    } catch (error) {
      console.warn('[AuthClient] Server logout failed:', error);
    }

    // Clear local session
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
   * Refresh authentication session
   */
  async refreshSession(): Promise<AuthResponse> {
    const refreshToken = StorageManager.getRefreshToken();
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    this.updateState({ isLoading: true });

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
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
      
      const session: AuthSession = {
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_at: authData.expires_at,
        user: authData.user
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

    } catch (error: any) {
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
  async validateSession(): Promise<boolean> {
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
  getAccessToken(): string | null {
    return StorageManager.getAccessToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return StorageManager.getCurrentUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return StorageManager.isAuthenticated();
  }

  /**
   * Initialize and validate session on startup
   */
  async initialize(): Promise<void> {
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