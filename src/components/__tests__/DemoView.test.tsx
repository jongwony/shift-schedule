import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DemoView } from '../DemoView';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });

it('recalculates a real transition violation without overwriting a saved schedule or calling APIs', () => {
  const saved = JSON.stringify({ id: 'my-real-schedule', assignments: [] });
  localStorage.setItem('shift-schedule-current', saved);
  const fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  render(<DemoView />);
  expect(screen.queryByText(/N→D 전이는 금지/)).not.toBeInTheDocument();
  const initialStatus = screen.getByRole('status').textContent;
  fireEvent.click(screen.getByRole('button', { name: 'N→D 위반 예시 만들기' }));
  expect(screen.getByLabelText('샘플 직원 1 2026-09-07 근무')).toHaveValue('N');
  expect(screen.getByRole('status').textContent).not.toBe(initialStatus);
  expect(screen.getAllByText(/N.*D/).length).toBeGreaterThan(1);
  fireEvent.change(screen.getByLabelText('샘플 직원 1 2026-09-07 근무'), { target: { value: 'D' } });
  expect(screen.getByRole('status').textContent).toBe(initialStatus);
  fireEvent.click(screen.getByRole('button', { name: 'N→D 위반 예시 만들기' }));
  fireEvent.click(screen.getByRole('button', { name: '샘플 초기화' }));
  expect(screen.getByRole('status').textContent).toBe(initialStatus);
  expect(localStorage.getItem('shift-schedule-current')).toBe(saved);
  expect(fetchSpy).not.toHaveBeenCalled();
});

it('does not migrate a legacy saved roster just by loading the app module', async () => {
  const saved = JSON.stringify({ id: 'legacy-roster', assignments: [] });
  localStorage.setItem('shift-schedule-version', '1');
  localStorage.setItem('shift-schedule-current', saved);
  await import('../../App');
  expect(localStorage.getItem('shift-schedule-current')).toBe(saved);
  expect(localStorage.getItem('shift-schedule-version')).toBe('1');
});
