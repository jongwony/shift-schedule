import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import {
  FIRST_VISIT_GUIDE_STORAGE_KEY,
  FIRST_VISIT_GUIDE_STORAGE_VERSION,
} from '@/components/firstVisitGuideStorage';

const authState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

const scheduleState = {
  staff: [] as Array<{ id: string; name: string }>,
  schedule: {
    id: 'schedule-1',
    name: '근무표',
    startDate: '2026-09-07',
    assignments: [],
  },
};

vi.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    ...authState,
    signIn: vi.fn(),
    signOut: vi.fn(),
    refreshUser: vi.fn(),
    getAccessToken: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSchedule', () => ({
  useSchedule: () => ({
    ...scheduleState,
    config: {},
    previousPeriodEnd: [],
    requiredNights: {},
    feasibilityResult: null,
    scheduleCompleteness: 0,
    generationStatus: 'idle',
    preCheckResult: null,
    generateDiagnosis: null,
    editingCell: null,
    affectedCells: new Map(),
    showAllViolations: false,
    addStaff: vi.fn(),
    removeStaff: vi.fn(),
    updateStaff: vi.fn(),
    updateAssignment: vi.fn(),
    toggleLock: vi.fn(),
    toggleExclusion: vi.fn(),
    resetCell: vi.fn(),
    setStartDate: vi.fn(),
    setPreviousPeriodEnd: vi.fn(),
    setRequiredNights: vi.fn(),
    generateAutoSchedule: vi.fn(),
    setEditingCell: vi.fn(),
    setShowAllViolations: vi.fn(),
    setHoveredCell: vi.fn(),
    setConfig: vi.fn(),
    importFromJSON: vi.fn(),
  }),
}));

vi.mock('@/components/LoginPrompt', () => ({
  LoginPrompt: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => open ? (
    <div role="dialog" aria-label="로그인 안내">
      로그인 안내
      <button type="button" onClick={() => onOpenChange(false)}>로그인 닫기</button>
    </div>
  ) : null,
}));

vi.mock('@/components/UpgradePrompt', () => ({
  UpgradePrompt: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => open ? (
    <div role="dialog" aria-label="업그레이드 안내">
      업그레이드 안내
      <button type="button" onClick={() => onOpenChange(false)}>업그레이드 닫기</button>
    </div>
  ) : null,
}));

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  scheduleState.staff = [];
  scheduleState.schedule = {
    id: 'schedule-1',
    name: '근무표',
    startDate: '2026-09-07',
    assignments: [],
  };
  authState.isLoading = false;
  vi.clearAllMocks();
});

beforeEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('editor first-visit guide integration', () => {
  it('auto-opens once, persists dismissal, and can be reopened manually', async () => {
    render(<App />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    const guide = await screen.findByRole('dialog', { name: '근무표 편집기 사용 안내' });
    expect(guide).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: '내 근무표 만들기' }).click();
    });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument());
    expect(JSON.parse(localStorage.getItem(FIRST_VISIT_GUIDE_STORAGE_KEY) ?? '{}')).toEqual({
      version: FIRST_VISIT_GUIDE_STORAGE_VERSION,
      dismissed: true,
    });

    screen.getByRole('button', { name: '사용 안내' }).click();
    expect(await screen.findByRole('dialog', { name: '근무표 편집기 사용 안내' })).toBeInTheDocument();
  });

  it('skips automatic onboarding on a later visit and for an existing roster', async () => {
    localStorage.setItem(
      FIRST_VISIT_GUIDE_STORAGE_KEY,
      JSON.stringify({ version: FIRST_VISIT_GUIDE_STORAGE_VERSION, dismissed: true }),
    );
    const { unmount } = render(<App />);
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();

    unmount();
    localStorage.clear();
    scheduleState.staff = [{ id: 'staff-1', name: '기존 직원' }];
    const { rerender } = render(<App />);
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();

    scheduleState.staff = [];
    await act(async () => {
      rerender(<App />);
    });
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();
  });

  it('does not open behind signup or upgrade query prompts after they close', async () => {
    window.history.replaceState({}, '', '/?signup=1');
    render(<App />);
    expect(screen.getByRole('dialog', { name: '로그인 안내' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();
    await act(async () => {
      screen.getByRole('button', { name: '로그인 닫기' }).click();
    });
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();

    window.history.replaceState({}, '', '/?upgrade=daypass');
    cleanup();
    render(<App />);
    expect(screen.getByRole('dialog', { name: '업그레이드 안내' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();
    await act(async () => {
      screen.getByRole('button', { name: '업그레이드 닫기' }).click();
    });
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();
  });

  it('waits for auth recovery before opening the guide', async () => {
    authState.isLoading = true;
    const { rerender } = render(<App />);
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    expect(screen.queryByRole('dialog', { name: '근무표 편집기 사용 안내' })).not.toBeInTheDocument();

    authState.isLoading = false;
    await act(async () => {
      rerender(<App />);
    });
    expect(await screen.findByRole('dialog', { name: '근무표 편집기 사용 안내' })).toBeInTheDocument();
  });
});
