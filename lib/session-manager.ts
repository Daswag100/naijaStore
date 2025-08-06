// lib/session-manager.ts - Fixed to handle real user authentication
"use client";

export class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSession();
    }
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private initializeSession(): void {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Get existing session ID from localStorage
    let sessionId = localStorage.getItem('naijastore_session_id');
    
    if (!sessionId) {
      // Generate new session ID - MAKE IT CONSISTENT
      sessionId = this.generateConsistentSessionId();
      localStorage.setItem('naijastore_session_id', sessionId);
      console.log('🆕 Created new session:', sessionId);
    } else {
      console.log('🔄 Using existing session:', sessionId);
    }
    
    this.sessionId = sessionId;
  }

  private generateConsistentSessionId(): string {
    // Only run on client side
    if (typeof window === 'undefined') return 'server-session';
    
    // Create a more consistent session ID based on browser fingerprint
    const userAgent = navigator.userAgent || '';
    const language = navigator.language || 'en';
    const platform = navigator.platform || '';
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    
    // Create fingerprint
    const fingerprint = `${userAgent}-${language}-${platform}-${screenSize}`;
    
    // Generate hash
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Add timestamp to make it unique but consistent for same browser
    const baseHash = Math.abs(hash).toString(36);
    
    // Check if we have a stored base session
    let baseSession = localStorage.getItem('naijastore_base_session');
    if (!baseSession) {
      baseSession = baseHash;
      localStorage.setItem('naijastore_base_session', baseSession);
    }
    
    return `guest_${baseSession}_session`;
  }

  public getSessionId(): string {
    // Only initialize on client side
    if (typeof window === 'undefined') return 'server-session';
    
    if (!this.sessionId) {
      this.initializeSession();
    }
    return this.sessionId || 'fallback-session';
  }

  public clearSession(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('naijastore_session_id');
    localStorage.removeItem('naijastore_base_session');
    localStorage.removeItem('naijastore_user_id');
    localStorage.removeItem('naijastore_is_authenticated');
    this.sessionId = null;
  }

  public upgradeToRealUser(userId: string): void {
    if (typeof window === 'undefined') return;
    
    // Store real user ID
    localStorage.setItem('naijastore_user_id', userId);
    localStorage.setItem('naijastore_is_authenticated', 'true');
    
    console.log('✅ Upgraded to real user:', userId);
  }

  public isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('naijastore_is_authenticated') === 'true';
  }

  public getRealUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('naijastore_user_id');
  }

  // FIXED: Get headers for API calls - prioritize real user auth
  public getApiHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Check if user is authenticated with real account - PRIORITY
    if (this.isAuthenticated()) {
      const userId = this.getRealUserId();
      if (userId) {
        console.log('🔐 Using real user authentication:', userId);
        headers['Authorization'] = `Bearer ${userId}`;
        return headers; // Don't add session ID for real users
      }
    }

    // For guest users, add session ID header
    const sessionId = this.getSessionId();
    headers['X-Session-ID'] = sessionId;
    console.log('👻 Using guest session:', sessionId);

    return headers;
  }

  // Method to check current auth status
  public getCurrentUser(): { isAuthenticated: boolean; userId: string | null; isGuest: boolean } {
    const isAuth = this.isAuthenticated();
    const userId = isAuth ? this.getRealUserId() : null;
    
    return {
      isAuthenticated: isAuth,
      userId: userId,
      isGuest: !isAuth,
    };
  }
}

// Hook for React components
import { useEffect, useState } from 'react';

export function useSession() {
  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [sessionId, setSessionId] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setSessionId(sessionManager.getSessionId());
    setIsAuthenticated(sessionManager.isAuthenticated());
  }, [sessionManager]);

  return {
    sessionId,
    isAuthenticated,
    sessionManager,
    getApiHeaders: () => sessionManager.getApiHeaders(),
    getCurrentUser: () => sessionManager.getCurrentUser(),
  };
}