/**
 * Authentication Context
 * Manages user auth state, login/logout, and token management
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

export interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = api.getToken();
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      // Try to parse role from token (JWT format)
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        setUserRole(payload.role);
        console.log('✅ [AuthContext] Token restored from storage');
      } catch (e) {
        console.error('❌ [AuthContext] Failed to parse token');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 [AuthContext] Logging in as', username);
      const response = await api.login(username, password);
      
      setToken(response.access_token);
      setUserRole(response.user_role);
      setIsAuthenticated(true);
      
      console.log('✅ [AuthContext] Login successful');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      console.error('❌ [AuthContext] Login error:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🔐 [AuthContext] Logging out');
    api.logout();
    setToken(null);
    setUserRole(null);
    setIsAuthenticated(false);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        token,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
