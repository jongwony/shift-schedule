import { createContext } from 'react';
import type { AuthUser } from '@/types/auth';

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null);
