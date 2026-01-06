import { useEffect, useRef } from 'react';
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

  // Calculate initial position synchronously (no ref access during render)
  const initialPosition = calculateInitialPosition(position);

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
        onClose();
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
      className={cn(
        'fixed z-50 min-w-[140px] rounded-md border border-gray-200 bg-white shadow-lg',
        'py-1 animate-in fade-in-0 zoom-in-95 duration-100'
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
