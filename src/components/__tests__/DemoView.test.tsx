import { fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DemoView } from '../DemoView';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

function firstCell() {
  const row = screen.getByRole('grid', { name: '근무표' }).querySelector<HTMLElement>('tbody tr')!;
  return within(row).getAllByRole('button')[1];
}

it('uses real click/menu editing and resets without reading or changing real storage or calling APIs', () => {
  const saved = JSON.stringify({ id: 'my-real-schedule', assignments: [] });
  localStorage.setItem('shift-schedule-current', saved);
  localStorage.setItem('shift-schedule-version', '1');
  const read = vi.spyOn(Storage.prototype, 'getItem');
  const write = vi.spyOn(Storage.prototype, 'setItem');
  const remove = vi.spyOn(Storage.prototype, 'removeItem');
  const fetchSpy = vi.fn();
  vi.stubGlobal('fetch', fetchSpy);
  render(<DemoView />);
  expect(screen.getByRole('grid', { name: '근무표' })).toBeInTheDocument();
  expect(firstCell()).toHaveTextContent('D');
  fireEvent.click(firstCell());
  expect(firstCell()).toHaveTextContent('E');
  fireEvent.contextMenu(firstCell(), { clientX: 100, clientY: 100 });
  fireEvent.click(screen.getByRole('menuitem', { name: /고정$/ }));
  expect(within(firstCell()).getByLabelText('고정됨')).toBeInTheDocument();
  fireEvent.click(firstCell());
  expect(firstCell()).toHaveTextContent('E');
  fireEvent.click(screen.getByRole('button', { name: 'N→D 위반 예시 만들기' }));
  expect(firstCell()).toHaveTextContent('E');
  expect(screen.getByText(/고정·배제를 해제/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '샘플 초기화' }));
  expect(firstCell()).toHaveTextContent('D');
  expect(screen.queryByLabelText('고정됨')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'N→D 위반 예시 만들기' }));
  expect(firstCell()).toHaveTextContent('N');
  expect(screen.getAllByText(/N→D/).length).toBeGreaterThan(1);
  expect(read).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(localStorage.getItem('shift-schedule-current')).toBe(saved);
});

it('shares exclusions, employee and settings tabs and discards sample state on remount', () => {
  const { unmount } = render(<DemoView />);
  fireEvent.contextMenu(firstCell(), { clientX: 100, clientY: 100 });
  fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'D' }));
  expect(firstCell()).toHaveTextContent('-');
  fireEvent.click(screen.getByRole('menuitem', { name: /초기화/ }));
  expect(firstCell()).toHaveTextContent('OFF');
  fireEvent.click(firstCell());
  expect(firstCell()).toHaveTextContent('D');
  fireEvent.mouseDown(screen.getByRole('tab', { name: '직원관리' }), { button: 0, ctrlKey: false });
  fireEvent.change(screen.getByPlaceholderText('직원 이름'), { target: { value: '가상 직원 추가' } });
  fireEvent.click(screen.getByRole('button', { name: '직원 추가' }));
  expect(screen.getByText('직원 목록 (9명)')).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole('tab', { name: '설정' }), { button: 0, ctrlKey: false });
  expect(screen.getByRole('tabpanel', { name: '설정' })).toBeInTheDocument();
  unmount();
  render(<DemoView />);
  expect(firstCell()).toHaveTextContent('D');
  expect(screen.queryByText('가상 직원 추가')).not.toBeInTheDocument();
});

it('does not migrate a legacy saved roster just by loading the app module', async () => {
  const saved = JSON.stringify({ id: 'legacy-roster', assignments: [] });
  localStorage.setItem('shift-schedule-version', '1');
  localStorage.setItem('shift-schedule-current', saved);
  await import('../../App');
  expect(localStorage.getItem('shift-schedule-current')).toBe(saved);
  expect(localStorage.getItem('shift-schedule-version')).toBe('1');
});
