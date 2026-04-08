/**
 * Authentication context provider.
 *
 * Manages JWT tokens (1h access + 7d refresh) in localStorage.
 * Anonymous browsing allowed — auth gates only auto-generation.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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

interface AuthContextValue {
  /** Current authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** Whether initial auth check is in progress. */
  isLoading: boolean;
  /** Whether user is authenticated. */
  isAuthenticated: boolean;
  /** Sign in with Google ID token. */
  signIn: (idToken: string) => Promise<void>;
  /** Sign out and clear tokens. */
  signOut: () => void;
  /** Refresh user data from server (e.g., after plan upgrade). */
  refreshUser: () => Promise<void>;
  /** Get a valid access token for API calls. Returns null if not authenticated. */
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
