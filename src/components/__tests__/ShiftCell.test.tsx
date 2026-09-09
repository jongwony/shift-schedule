import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShiftCell } from '../ShiftCell';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderCell(
  overrides: Partial<React.ComponentProps<typeof ShiftCell>> = {},
  options: { strictMode?: boolean } = {},
) {
  const onChange = vi.fn();
  const onToggleLock = vi.fn();
  const onToggleExclusion = vi.fn();
  const onResetCell = vi.fn();

  const cell = (
    <ShiftCell
      shift={null}
      violations={[]}
      onChange={onChange}
      onToggleLock={onToggleLock}
      onToggleExclusion={onToggleExclusion}
      onResetCell={onResetCell}
      {...overrides}
    />
  );
  render(options.strictMode ? <StrictMode>{cell}</StrictMode> : cell);

  return { onChange, onToggleLock, onToggleExclusion, onResetCell };
}

describe('ShiftCell', () => {
  it('opens a semantic context menu from right click and exposes its menu state', () => {
    const { onToggleLock, onResetCell } = renderCell({ shift: 'D' });
    const cell = screen.getByRole('button', { name: /데이 \(D\)/ });

    expect(cell).toHaveAttribute('aria-haspopup', 'menu');
    expect(cell).toHaveAttribute('aria-expanded', 'false');

    fireEvent.contextMenu(cell, { clientX: 40, clientY: 60 });

    expect(cell).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /고정/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /초기화/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /고정/ }));
    expect(onToggleLock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(cell, { clientX: 40, clientY: 60 });
    fireEvent.click(screen.getByRole('menuitem', { name: /초기화/ }));
    expect(onResetCell).toHaveBeenCalledTimes(1);
  });

  it.each(['F10', 'ContextMenu'])('opens the context menu from the keyboard %s command', (key) => {
    renderCell();
    const cell = screen.getByRole('button', { name: /근무 미배정/ });

    fireEvent.keyDown(cell, { key, shiftKey: key === 'F10' });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(cell).toHaveAttribute('aria-expanded', 'true');
  });

  it('supports keyboard menu navigation and restores focus after Escape', async () => {
    renderCell({ shift: 'D' }, { strictMode: true });
    const cell = screen.getByRole('button', { name: /데이 \(D\)/ });
    cell.focus();

    fireEvent.keyDown(cell, { key: 'F10', shiftKey: true });

    const lockItem = screen.getByRole('menuitem', { name: /고정/ });
    const firstExclusionButton = screen.getByRole('button', { name: /^D$/ });
    const resetItem = screen.getByRole('menuitem', { name: /초기화/ });
    await waitFor(() => expect(lockItem).toHaveFocus());

    fireEvent.keyDown(lockItem, { key: 'ArrowDown' });
    expect(firstExclusionButton).toHaveFocus();

    fireEvent.keyDown(firstExclusionButton, { key: 'End' });
    expect(resetItem).toHaveFocus();

    fireEvent.keyDown(resetItem, { key: 'Home' });
    expect(lockItem).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(cell).toHaveFocus();
    });
  });

  it('anchors a long-press menu to its own button when another element has focus', () => {
    vi.useFakeTimers();
    const otherControl = document.createElement('button');
    otherControl.type = 'button';
    document.body.appendChild(otherControl);
    renderCell();
    const cell = screen.getByRole('button', { name: /근무 미배정/ });
    vi.spyOn(cell, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      left: 100,
      top: 200,
      right: 140,
      bottom: 230,
      width: 40,
      height: 30,
      toJSON: () => ({}),
    });
    otherControl.focus();

    fireEvent.touchStart(cell, { touches: [{ clientX: 2, clientY: 3 }] });
    act(() => vi.advanceTimersByTime(500));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '120px', top: '215px' });
  });

  it('tells locked users how to reach the unlock action', async () => {
    const { onChange } = renderCell({ shift: 'D', isLocked: true });
    const cell = screen.getByRole('button', { name: /데이 \(D\)/ });
    const { toast } = await import('sonner');
    const info = vi.spyOn(toast, 'info');

    fireEvent.click(cell);

    expect(onChange).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith(expect.stringContaining('길게 누르거나 우클릭'));
  });
});
