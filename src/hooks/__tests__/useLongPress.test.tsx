import { act, cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLongPress } from '../useLongPress';

interface HarnessProps {
  onLongPress: () => void;
  onPressStart?: () => void;
  onPressEnd?: () => void;
}

function Harness({ onLongPress, onPressStart, onPressEnd }: HarnessProps) {
  const handlers = useLongPress({
    onLongPress,
    onPressStart,
    onPressEnd,
    threshold: 500,
  });

  return <button type="button" data-testid="long-press-target" {...handlers}>누르기</button>;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useLongPress', () => {
  it('fires only after the configured touch threshold and ends the press once', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onPressStart = vi.fn();
    const onPressEnd = vi.fn();
    render(<Harness onLongPress={onLongPress} onPressStart={onPressStart} onPressEnd={onPressEnd} />);
    const target = screen.getByTestId('long-press-target');

    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 20 }] });
    expect(onPressStart).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(499));
    expect(onLongPress).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onPressEnd).toHaveBeenCalledTimes(1);

    const touchEndEvent = createEvent.touchEnd(target, { touches: [] });
    fireEvent(target, touchEndEvent);
    expect(onPressEnd).toHaveBeenCalledTimes(1);
    expect(touchEndEvent.defaultPrevented).toBe(true);
  });

  it('cancels when the touch moves beyond the scroll threshold or is cancelled', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onPressEnd = vi.fn();
    render(<Harness onLongPress={onLongPress} onPressEnd={onPressEnd} />);
    const target = screen.getByTestId('long-press-target');

    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 20 }] });
    fireEvent.touchMove(target, { touches: [{ clientX: 21, clientY: 20 }] });
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPressEnd).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 20 }] });
    fireEvent.touchCancel(target);
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPressEnd).toHaveBeenCalledTimes(2);
  });

  it('cancels a multi-touch gesture and clears its timer on unmount', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onPressEnd = vi.fn();
    const { unmount } = render(<Harness onLongPress={onLongPress} onPressEnd={onPressEnd} />);
    const target = screen.getByTestId('long-press-target');

    fireEvent.touchStart(target, {
      touches: [
        { clientX: 10, clientY: 20 },
        { clientX: 30, clientY: 40 },
      ],
    });
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPressEnd).not.toHaveBeenCalled();

    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 20 }] });
    fireEvent.touchStart(target, {
      touches: [
        { clientX: 10, clientY: 20 },
        { clientX: 30, clientY: 40 },
      ],
    });
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPressEnd).toHaveBeenCalledTimes(1);

    fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 20 }] });
    unmount();
    act(() => vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
