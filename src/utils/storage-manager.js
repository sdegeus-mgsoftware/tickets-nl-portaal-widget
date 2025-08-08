// Removed TypeScript imports

/**
 * Storage Manager for handling authentication tokens
 * Handles localStorage operations with optional encryption for security
 */
export class StorageManager {
  static STORAGE_KEY = 'mg_widget_auth';
  static ACCESS_TOKEN_KEY = 'mg_access_token';
  static REFRESH_TOKEN_KEY = 'mg_refresh_token';
  static STORAGE_VERSION = '1.0';

  /**
   * Simple encryption/decryption using base64 and basic obfuscation
   * Note: This is not cryptographically secure, but adds a layer of obfuscation
   */
  static encrypt(data) {
    try {
      // Simple obfuscation: reverse + base64
      const reversed = data.split('').reverse().join('');
      return btoa(reversed);
    } catch (error) {
      return data;
    }
  }

  static decrypt(data) {
    try {
      // Reverse the obfuscation
      const decoded = atob(data);
      return decoded.split('').reverse().join('');
    } catch (error) {
      return data;
    }
  }

  /**
   * Check if localStorage is available
   */
  static isStorageAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store authentication session
   */
  static storeSession(session) {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      
      
      const sessionData = {
        version: this.STORAGE_VERSION,
        data: session,
        timestamp: Date.now()
      };

      // Store encrypted session data
      const encrypted = this.encrypt(JSON.stringify(sessionData));
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      
      // Also store tokens in MG Tickets API format for compatibility
      if (session.access_token) {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, session.access_token);
      }
      if (session.refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, session.refresh_token);
      } else {
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieve authentication session (auto-clears if expired)
   */
  static getSession() {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const decrypted = this.decrypt(stored);
      const sessionData = JSON.parse(decrypted);

      // Check version compatibility
      if (sessionData.version !== this.STORAGE_VERSION) {
        this.clearSession();
        return null;
      }

      // Check if session is expired
      const session = sessionData.data;
      const expired = this.isSessionExpired(session);
      if (expired) {
        // Do not clear storage here to preserve the refresh token for the
        // refresh flow. Simply signal that the current session is not valid.
        return null;
      }

      return session;
    } catch (error) {
      this.clearSession(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Retrieve raw session data without expiration check (for refresh token access)
   */
  static getRawSession() {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const decrypted = this.decrypt(stored);
      const sessionData = JSON.parse(decrypted);

      // Check version compatibility
      if (sessionData.version !== this.STORAGE_VERSION) {
        this.clearSession();
        return null;
      }

      

      // Return session data without expiration check
      return sessionData.data;
    } catch (error) {
      this.clearSession(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(session) {
    if (!session.expires_at) {
      return false; // If no expiry, assume valid
    }

    const now = Date.now();
    const expiryTime = session.expires_at * 1000; // Convert to milliseconds
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    return now >= (expiryTime - bufferTime);
  }

  /**
   * Clear stored session
   */
  static clearSession() {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);

    } catch (error) {
    }
  }

  /**
   * Update refresh token
   */
  static updateRefreshToken(refreshToken) {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    session.refresh_token = refreshToken;
    return this.storeSession(session);
  }

  /**
   * Get stored refresh token
   */
  static getRefreshToken() {
    const session = this.getSession();
    if (session?.refresh_token) {
      return session.refresh_token;
    }
    
    // Fallback to individual key for MG Tickets API compatibility
    if (this.isStorageAvailable()) {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY) || null;
    }
    
    return null;
  }

  /**
   * Get stored access token
   */
  static getAccessToken() {
    const session = this.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
    
    // Fallback to individual key for MG Tickets API compatibility
    if (this.isStorageAvailable()) {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY) || null;
    }
    
    return null;
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  static isAuthenticated() {
    const session = this.getSession();
    return session !== null && !this.isSessionExpired(session);
  }

  /**
   * Get stored user info
   */
  static getCurrentUser() {
    const session = this.getSession();
    return session?.user || null;
  }
}