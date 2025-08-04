import { AuthSession } from '@/core/types';

/**
 * Storage Manager for handling authentication tokens
 * Handles localStorage operations with optional encryption for security
 */
export class StorageManager {
  private static readonly STORAGE_KEY = 'tickets_widget_auth';
  private static readonly STORAGE_VERSION = '1.0';

  /**
   * Simple encryption/decryption using base64 and basic obfuscation
   * Note: This is not cryptographically secure, but adds a layer of obfuscation
   */
  private static encrypt(data: string): string {
    try {
      // Simple obfuscation: reverse + base64
      const reversed = data.split('').reverse().join('');
      return btoa(reversed);
    } catch (error) {
      console.warn('[StorageManager] Encryption failed, storing as plain text:', error);
      return data;
    }
  }

  private static decrypt(data: string): string {
    try {
      // Reverse the obfuscation
      const decoded = atob(data);
      return decoded.split('').reverse().join('');
    } catch (error) {
      console.warn('[StorageManager] Decryption failed, assuming plain text:', error);
      return data;
    }
  }

  /**
   * Check if localStorage is available
   */
  private static isStorageAvailable(): boolean {
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
  static storeSession(session: AuthSession): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('[StorageManager] localStorage not available');
      return false;
    }

    try {
      const sessionData = {
        version: this.STORAGE_VERSION,
        data: session,
        timestamp: Date.now()
      };

      const encrypted = this.encrypt(JSON.stringify(sessionData));
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      

      return true;
    } catch (error) {
      console.error('[StorageManager] Failed to store session:', error);
      return false;
    }
  }

  /**
   * Retrieve authentication session
   */
  static getSession(): AuthSession | null {
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
        console.warn('[StorageManager] Version mismatch, clearing old session');
        this.clearSession();
        return null;
      }

      // Check if session is expired
      const session = sessionData.data as AuthSession;
      if (this.isSessionExpired(session)) {

        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('[StorageManager] Failed to retrieve session:', error);
      this.clearSession(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(session: AuthSession): boolean {
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
  static clearSession(): void {
    if (!this.isStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);

    } catch (error) {
      console.error('[StorageManager] Failed to clear session:', error);
    }
  }

  /**
   * Update refresh token
   */
  static updateRefreshToken(refreshToken: string): boolean {
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
  static getRefreshToken(): string | null {
    const session = this.getSession();
    return session?.refresh_token || null;
  }

  /**
   * Get stored access token
   */
  static getAccessToken(): string | null {
    const session = this.getSession();
    return session?.access_token || null;
  }

  /**
   * Check if user is authenticated (has valid session)
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null && !this.isSessionExpired(session);
  }

  /**
   * Get stored user info
   */
  static getCurrentUser(): AuthSession['user'] | null {
    const session = this.getSession();
    return session?.user || null;
  }
}