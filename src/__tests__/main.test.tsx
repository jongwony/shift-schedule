import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getStoredAccessToken: vi.fn(() => 'valid-access-token'),
  getStoredRefreshToken: vi.fn(() => 'valid-refresh-token'),
  getValidAccessToken: vi.fn(async () => 'valid-access-token'),
  getCurrentUser: vi.fn(),
  clearTokens: vi.fn(),
  loginWithGoogle: vi.fn(),
  storeTokens: vi.fn(),
}));

vi.mock('@/services/authApi', () => authMocks);
vi.mock('../App.tsx', () => ({
  default: () => <h1>샘플 근무표 검증 체험</h1>,
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.clearAllMocks();
});

it('mounts the public demo without initializing an authenticated session', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  window.history.replaceState({}, '', '/demo/');
  localStorage.setItem('shift-schedule-access-token', 'saved-access-token');
  localStorage.setItem('shift-schedule-refresh-token', 'saved-refresh-token');

  await act(async () => {
    await import('../main');
  });

  expect(await screen.findByRole('heading', { name: '샘플 근무표 검증 체험' })).toBeInTheDocument();
  expect(authMocks.getStoredAccessToken).not.toHaveBeenCalled();
  expect(authMocks.getStoredRefreshToken).not.toHaveBeenCalled();
  expect(authMocks.getValidAccessToken).not.toHaveBeenCalled();
  expect(authMocks.getCurrentUser).not.toHaveBeenCalled();
});
