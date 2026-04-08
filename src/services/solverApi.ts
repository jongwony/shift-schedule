import type {
  GenerateRequest,
  GenerateResponse,
  FeasibilityCheckRequest,
  FeasibilityCheckResponse,
} from '@/types/api';
import { GenerationLimitError } from '@/types/auth';
import type { GenerationLimitInfo } from '@/types/auth';
import { getValidAccessToken, clearTokens } from '@/services/authApi';

const API_BASE = import.meta.env.VITE_SOLVER_API_URL ?? '';

/** Last known remaining generation count from X-Generation-Remaining header. */
let _lastRemainingCount: number | null = null;

export function getLastRemainingCount(): number | null {
  return _lastRemainingCount;
}

async function authenticatedFetch(url: string, options: RequestInit): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  let response = await fetch(url, { ...options, headers });

  // Handle 401: try refresh once, then retry
  if (response.status === 401) {
    // Token might have just expired — getValidAccessToken should have refreshed,
    // but if the server rejected it, clear and signal auth needed
    clearTokens();
    throw new Error('Authentication required');
  }

  // Handle 403: generation limit
  if (response.status === 403) {
    const errorBody = await response.json().catch(() => null);
    if (errorBody?.error?.code === 'GENERATION_LIMIT') {
      const info: GenerationLimitInfo = {
        remaining: errorBody.remaining ?? 0,
        limit: errorBody.limit ?? 3,
        plans: errorBody.plans ?? [],
      };
      _lastRemainingCount = 0;
      throw new GenerationLimitError(info);
    }
  }

  return response;
}

export async function generateSchedule(request: GenerateRequest): Promise<GenerateResponse> {
  if (!API_BASE) {
    throw new Error('VITE_SOLVER_API_URL not configured');
  }

  const response = await authenticatedFetch(`${API_BASE}/generate`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  // Read remaining generation count from header
  const remaining = response.headers.get('X-Generation-Remaining');
  if (remaining !== null) {
    _lastRemainingCount = parseInt(remaining, 10);
  }

  return response.json();
}

export async function checkFeasibilityApi(
  request: FeasibilityCheckRequest
): Promise<FeasibilityCheckResponse> {
  if (!API_BASE) {
    throw new Error('VITE_SOLVER_API_URL not configured');
  }

  // Feasibility check does NOT require auth
  const response = await fetch(`${API_BASE}/check-feasibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export function isApiConfigured(): boolean {
  return !!import.meta.env.VITE_SOLVER_API_URL;
}
