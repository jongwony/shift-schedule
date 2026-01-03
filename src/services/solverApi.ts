import type {
  GenerateRequest,
  GenerateResponse,
  FeasibilityCheckRequest,
  FeasibilityCheckResponse,
} from '@/types/api';

const API_BASE = import.meta.env.VITE_SOLVER_API_URL ?? '';

export async function generateSchedule(request: GenerateRequest): Promise<GenerateResponse> {
  if (!API_BASE) {
    throw new Error('VITE_SOLVER_API_URL not configured');
  }

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function checkFeasibilityApi(
  request: FeasibilityCheckRequest
): Promise<FeasibilityCheckResponse> {
  if (!API_BASE) {
    throw new Error('VITE_SOLVER_API_URL not configured');
  }

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
