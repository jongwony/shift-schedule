/**
 * Auth API client for shift-schedule monetization.
 */

import type {
  AuthResponse,
  AuthUser,
  RefreshResponse,
} from '@/types/auth';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error('VITE_API_URL not configured');
  }
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message ?? `API error: ${response.status}`);
  }
  return response.json();
}

/** Exchange Google ID token for app JWT tokens + user info. */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

/** Refresh access token using refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  return authFetch<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
}

/** Get current user info (also performs payment reconciliation). */
export async function getCurrentUser(accessToken: string): Promise<{ user: AuthUser }> {
  return authFetch<{ user: AuthUser }>('/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// --- Token Storage (localStorage) ---

const ACCESS_TOKEN_KEY = 'shift-schedule-access-token';
const REFRESH_TOKEN_KEY = 'shift-schedule-refresh-token';

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Check if access token is expired by decoding JWT payload. */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Get a valid access token, refreshing if needed.
 * Returns null if no valid session exists.
 */
export async function getValidAccessToken(): Promise<string | null> {
  const accessToken = getStoredAccessToken();
  if (accessToken && !isTokenExpired(accessToken)) {
    return accessToken;
  }

  // Try refresh
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearTokens();
    return null;
  }

  try {
    const { accessToken: newToken } = await refreshAccessToken(refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    return newToken;
  } catch {
    clearTokens();
    return null;
  }
}
