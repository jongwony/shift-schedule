import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: Position;
  onClose: () => void;
  children: React.ReactNode;
}

interface ContextMenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Calculate adjusted position with boundary detection.
 * Uses estimated menu dimensions for initial positioning.
 */
function calculateInitialPosition(position: Position): { top: number; left: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  // Estimated menu dimensions (matches min-width and typical height)
  const estimatedWidth = 140;
  const estimatedHeight = 80;

  let top = position.y;
  let left = position.x;

  // Flip horizontally if near right edge
  if (position.x + estimatedWidth > viewportWidth - 10) {
    left = position.x - estimatedWidth;
  }

  // Flip vertically if near bottom edge
  if (position.y + estimatedHeight > viewportHeight - 10) {
    top = position.y - estimatedHeight;
  }

  // Ensure minimum distance from edges
  left = Math.max(10, Math.min(left, viewportWidth - estimatedWidth - 10));
  top = Math.max(10, Math.min(top, viewportHeight - estimatedHeight - 10));

  return { top, left };
}

/**
 * Context menu component that positions itself near the click/touch point.
 * Handles screen boundary detection and flips position if near edge.
 * Closes on outside click or Escape key.
 */
export function ContextMenu({ position, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Calculate initial position synchronously (no ref access during render)
  const initialPosition = calculateInitialPosition(position);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    // Exclusion controls make this menu taller than the initial estimate.
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(10, Math.min(position.x, window.innerWidth - rect.width - 10))}px`;
    menu.style.top = `${Math.max(10, Math.min(position.y, window.innerHeight - rect.height - 10))}px`;
  }, [position.x, position.y]);

  useEffect(() => {
    // StrictMode replays effects; do not replace the trigger with our own item.
    if (!menuRef.current?.contains(document.activeElement)) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    }
    menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        previousFocusRef.current?.focus();
      }
    };

    // Delay adding listeners to prevent immediate close from the triggering click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      onKeyDown={(event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        if (!buttons.length) return;
        event.preventDefault();
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus();
      }}
      className={cn(
        'fixed z-50 min-w-[140px] rounded-md border border-gray-200 bg-white shadow-lg',
        'py-1 max-h-[calc(100dvh-20px)] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100'
      )}
      style={{
        top: initialPosition.top,
        left: initialPosition.left,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Individual menu item for ContextMenu.
 */
export function ContextMenuItem({ onClick, children, className }: ContextMenuItemProps) {
  const handleClick = () => {
    onClick();
  };

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      className={cn(
        'flex w-full items-center px-3 py-2 text-sm text-gray-700',
        'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
        'transition-colors duration-100',
        className
      )}
    >
      {children}
    </button>
  );
}
