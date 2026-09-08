/**
 * Authentication context provider.
 *
 * Manages JWT tokens (1h access + 7d refresh) in localStorage.
 * Anonymous browsing allowed — auth gates only auto-generation.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { AuthContext, type AuthContextValue } from './authContext';
import type { AuthUser } from '@/types/auth';
import {
  clearTokens,
  getCurrentUser,
  getStoredAccessToken,
  getStoredRefreshToken,
  getValidAccessToken,
  loginWithGoogle,
  storeTokens,
} from '@/services/authApi';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      if (!accessToken && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getValidAccessToken();
        if (token) {
          const { user: userData } = await getCurrentUser(token);
          setUser(userData);
        }
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const signIn = useCallback(async (idToken: string) => {
    const response = await loginWithGoogle(idToken);
    storeTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getValidAccessToken();
    if (token) {
      const { user: userData } = await getCurrentUser(token);
      setUser(userData);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    return getValidAccessToken();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signIn,
      signOut,
      refreshUser,
      getAccessToken,
    }),
    [user, isLoading, signIn, signOut, refreshUser, getAccessToken],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
