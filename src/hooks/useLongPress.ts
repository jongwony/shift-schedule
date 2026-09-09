import { useCallback, useEffect, useRef } from 'react';

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
  const isPressActiveRef = useRef(false);
  const isMultiTouchRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPress = useCallback(() => {
    clearTimer();
    if (isPressActiveRef.current) {
      onPressEnd?.();
    }
    isPressActiveRef.current = false;
    startPosRef.current = null;
  }, [clearTimer, onPressEnd]);

  useEffect(() => {
    return () => {
      clearTimer();
      isPressActiveRef.current = false;
      startPosRef.current = null;
      isLongPressTriggeredRef.current = false;
      isMultiTouchRef.current = false;
    };
  }, [clearTimer]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // A long press is only meaningful for one finger. A second finger
      // should cancel the pending press so it cannot open a menu while zooming
      // or scrolling.
      if (e.touches.length !== 1) {
        cancelPress();
        isLongPressTriggeredRef.current = false;
        isMultiTouchRef.current = true;
        return;
      }

      cancelPress();
      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      isLongPressTriggeredRef.current = false;
      isMultiTouchRef.current = false;
      isPressActiveRef.current = true;

      onPressStart?.();

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (!isPressActiveRef.current) return;

        isLongPressTriggeredRef.current = true;
        onPressEnd?.();
        isPressActiveRef.current = false;
        onLongPress();
      }, threshold);
    },
    [cancelPress, onLongPress, onPressStart, onPressEnd, threshold]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const wasLongPress = isLongPressTriggeredRef.current;
      const wasMultiTouch = isMultiTouchRef.current;

      // If another touch remains, this gesture became multi-touch and must
      // not fall through to a click when the remaining touch ends.
      if (e.touches.length > 0) {
        cancelPress();
        isMultiTouchRef.current = true;
        if (wasLongPress || wasMultiTouch) {
          e.preventDefault();
        }
        return;
      }

      cancelPress();

      // Prevent click if long press was triggered
      if (wasLongPress || wasMultiTouch) {
        e.preventDefault();
      }
      isLongPressTriggeredRef.current = false;
      isMultiTouchRef.current = false;
    },
    [cancelPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return;

      if (e.touches.length !== 1) {
        cancelPress();
        isMultiTouchRef.current = true;
        return;
      }

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // Cancel long press if moved beyond threshold (user is scrolling)
      if (deltaX > moveThreshold || deltaY > moveThreshold) {
        cancelPress();
      }
    },
    [cancelPress, moveThreshold]
  );

  const handleTouchCancel = useCallback(() => {
    cancelPress();
    isLongPressTriggeredRef.current = false;
    isMultiTouchRef.current = false;
  }, [cancelPress]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onTouchCancel: handleTouchCancel,
  };
}
