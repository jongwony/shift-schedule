import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  /** Callback fired when long press is detected */
  onLongPress: () => void;
  /** Callback fired when press starts (for visual feedback) */
  onPressStart?: () => void;
  /** Callback fired when press ends (for visual feedback) */
  onPressEnd?: () => void;
  /** Duration in ms to trigger long press (default: 500) */
  threshold?: number;
  /** Move distance in px that cancels the long press (default: 10) */
  moveThreshold?: number;
}

interface UseLongPressReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
}

/**
 * Custom hook for detecting long press on touch devices.
 * Cancels if user moves finger (scroll detection).
 */
export function useLongPress({
  onLongPress,
  onPressStart,
  onPressEnd,
  threshold = 500,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      isLongPressTriggeredRef.current = false;

      onPressStart?.();

      timerRef.current = setTimeout(() => {
        isLongPressTriggeredRef.current = true;
        onLongPress();
        onPressEnd?.();
      }, threshold);
    },
    [onLongPress, onPressStart, onPressEnd, threshold]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer();
      onPressEnd?.();

      // Prevent click if long press was triggered
      if (isLongPressTriggeredRef.current) {
        e.preventDefault();
      }
      startPosRef.current = null;
    },
    [clearTimer, onPressEnd]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // Cancel long press if moved beyond threshold (user is scrolling)
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        clearTimer();
        onPressEnd?.();
        startPosRef.current = null;
      }
    },
    [clearTimer, onPressEnd, moveThreshold]
  );

  const handleTouchCancel = useCallback(() => {
    clearTimer();
    onPressEnd?.();
    startPosRef.current = null;
  }, [clearTimer, onPressEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onTouchCancel: handleTouchCancel,
  };
}
