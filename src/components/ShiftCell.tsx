import { useState } from 'react';
import { toast } from 'sonner';
import type { ShiftType, EligibleShift, Violation } from '@/types';
import type { ImpactReason } from '@/utils/impactCalculator';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import { ContextMenu, ContextMenuItem } from './ContextMenu';

interface ShiftCellProps {
  shift: ShiftType | null;
  violations: Violation[];
  isAffected?: boolean;
  affectReason?: ImpactReason;
  isLocked?: boolean;
  eligibleShifts?: EligibleShift[];
  onChange: (shift: ShiftType) => void;
  onToggleLock?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const IMPACT_STYLES: Record<ImpactReason, { bg: string; label: string }> = {
  staffing: { bg: 'bg-blue-50', label: '같은 날짜 인원 수 영향' },
  sequence: { bg: 'bg-orange-50', label: '연속 근무 규칙 영향' },
};

const SHIFT_CONFIG: Record<ShiftType, { bg: string; hover: string; text: string; label: string }> = {
  D: { bg: 'bg-amber-100', hover: 'hover:bg-amber-200', text: 'text-amber-800', label: '데이' },
  E: { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-800', label: '이브닝' },
  N: { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-800', label: '나이트' },
  OFF: { bg: 'bg-slate-100', hover: 'hover:bg-slate-200', text: 'text-slate-600', label: '휴무' },
};

const ALL_ELIGIBLE: EligibleShift[] = ['D', 'E', 'N'];

export function ShiftCell({
  shift,
  violations,
  isAffected,
  affectReason,
  isLocked,
  eligibleShifts = ALL_ELIGIBLE,
  onChange,
  onToggleLock,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
}: ShiftCellProps) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isPressing, setIsPressing] = useState(false);

  const hasError = violations.some((v) => v.severity === 'error');
  const hasWarning = violations.some((v) => v.severity === 'warning');
  const violationMessages = violations.map((v) => v.message).join('\n');
  const impactStyle = affectReason ? IMPACT_STYLES[affectReason] : null;

  // Build dynamic cycle from eligible shifts: [eligible..., 'OFF']
  const cycle: ShiftType[] = [...eligibleShifts, 'OFF'];

  const handleClick = () => {
    if (isLocked) {
      toast.info('셀이 고정되어 있습니다. 우클릭으로 해제하세요.');
      return;
    }
    const currentIndex = shift !== null ? cycle.indexOf(shift) : -1;
    const nextIndex = (currentIndex + 1) % cycle.length;
    onChange(cycle[nextIndex]);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleToggleLock = () => {
    onToggleLock?.();
    setShowContextMenu(false);
  };

  const handleReset = () => {
    if (!isLocked) {
      onChange('OFF');
    }
    setShowContextMenu(false);
  };

  // Long press handlers for mobile
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      // Use last touch position or center of element
      const element = document.activeElement as HTMLElement;
      const rect = element?.getBoundingClientRect();
      if (rect) {
        setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
      setShowContextMenu(true);
    },
    onPressStart: () => setIsPressing(true),
    onPressEnd: () => setIsPressing(false),
    threshold: 500,
  });

  const config = shift ? SHIFT_CONFIG[shift] : null;
  const ariaLabel = config
    ? `${config.label} (${shift})${violations.length > 0 ? `, ${violations.length}개 위반` : ''}${isAffected && impactStyle ? `, ${impactStyle.label}` : ''}`
    : '근무 미배정, 클릭하여 배정';

  // Build title with all relevant info
  const titleParts: string[] = [];
  if (isAffected && impactStyle) {
    titleParts.push(impactStyle.label);
  }
  if (violationMessages) {
    titleParts.push(violationMessages);
  } else if (config) {
    titleParts.push(`${config.label} - 클릭하여 변경`);
  } else {
    titleParts.push('클릭하여 근무 배정');
  }
  const title = titleParts.join('\n');

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onFocus={onFocus}
        onBlur={onBlur}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...longPressHandlers}
        title={title}
        aria-label={ariaLabel}
        className={cn(
          'relative w-12 h-10 flex items-center justify-center text-sm font-medium rounded border cursor-pointer',
          'transition-all duration-150 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-95',
          // Base background (affected overrides if no error/warning)
          isAffected && impactStyle && !hasError && !hasWarning ? impactStyle.bg : config ? config.bg : 'bg-gray-50 hover:bg-gray-100',
          config ? config.hover : '',
          config ? config.text : 'text-gray-400',
          // Error/warning states (override affected)
          hasError && 'bg-red-100 border-red-400 ring-2 ring-red-500 hover:bg-red-200',
          hasWarning && !hasError && 'border-yellow-400 ring-2 ring-yellow-500 hover:bg-yellow-100',
          !hasError && !hasWarning && !isAffected && !isLocked && 'border-gray-200 hover:border-gray-300',
          // Locked state
          isLocked && !hasError && !hasWarning && 'ring-2 ring-green-500 border-green-400',
          // Pressing feedback (for long-press)
          isPressing && 'scale-95 opacity-70'
        )}
      >
        {config ? (
          <span aria-hidden="true">{shift}</span>
        ) : (
          <span className="text-gray-300" aria-hidden="true">-</span>
        )}
        {/* Lock indicator */}
        {isLocked && (
          <span className="absolute -top-1 -right-1 text-[10px] leading-none" aria-label="고정됨">
            🔒
          </span>
        )}
      </button>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu position={menuPosition} onClose={() => setShowContextMenu(false)}>
          <ContextMenuItem onClick={handleToggleLock}>
            {isLocked ? '🔓 고정 해제' : '🔒 고정'}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleReset}>
            ↺ 초기화
          </ContextMenuItem>
        </ContextMenu>
      )}
    </>
  );
}
