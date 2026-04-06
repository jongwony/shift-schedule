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
  excludedShifts?: ShiftType[];
  onChange: (shift: ShiftType) => void;
  onToggleLock?: () => void;
  onToggleExclusion?: (shift: ShiftType) => void;
  onResetCell?: () => void;
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
const EMPTY_EXCLUSIONS: ShiftType[] = [];

const EXCLUSION_BUTTON_STYLES: Record<ShiftType, string> = {
  D: 'bg-amber-100 text-amber-800 border-amber-300',
  E: 'bg-blue-100 text-blue-800 border-blue-300',
  N: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  OFF: 'bg-slate-100 text-slate-600 border-slate-300',
};

export function ShiftCell({
  shift,
  violations,
  isAffected,
  affectReason,
  isLocked,
  eligibleShifts = ALL_ELIGIBLE,
  excludedShifts = EMPTY_EXCLUSIONS,
  onChange,
  onToggleLock,
  onToggleExclusion,
  onResetCell,
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
  const hasExclusions = excludedShifts.length > 0;

  // Build dynamic cycle: eligible shifts minus excluded, plus OFF if not excluded
  const cycle: ShiftType[] = [
    ...eligibleShifts.filter((s) => !excludedShifts.includes(s)),
    ...(!excludedShifts.includes('OFF') ? ['OFF' as ShiftType] : []),
  ];

  // Available shifts for exclusion toggles: eligible + OFF
  const availableForExclusion: ShiftType[] = [...eligibleShifts, 'OFF'];
  const maxExclusions = Math.min(2, availableForExclusion.length - 2);

  // Show exclusion section when cell has assignment or existing exclusions
  const showExclusionSection = !isLocked && (shift !== null || hasExclusions) && maxExclusions > 0;

  const isIneligible = shift !== null && shift !== 'OFF' && !eligibleShifts.includes(shift as EligibleShift);

  const handleClick = () => {
    if (isLocked) {
      toast.info('셀이 고정되어 있습니다. 우클릭으로 해제하세요.');
      return;
    }
    if (cycle.length === 0) return;
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
      onResetCell?.();
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
    ? `${config.label} (${shift})${violations.length > 0 ? `, ${violations.length}개 위반` : ''}${isAffected && impactStyle ? `, ${impactStyle.label}` : ''}${hasExclusions ? `, ${excludedShifts.join(',')} 배제` : ''}`
    : `근무 미배정${hasExclusions ? `, ${excludedShifts.join(',')} 배제` : ''}, 클릭하여 배정`;

  // Build title with all relevant info
  const titleParts: string[] = [];
  if (hasExclusions) {
    titleParts.push(`배제: ${excludedShifts.join(', ')}`);
  }
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
          !hasError && !hasWarning && !isAffected && !isLocked && !hasExclusions && 'border-gray-200 hover:border-gray-300',
          // Locked state
          isLocked && !hasError && !hasWarning && 'ring-2 ring-green-500 border-green-400',
          // Excluded state
          hasExclusions && !isLocked && !hasError && !hasWarning && 'ring-2 ring-red-400 border-red-300',
          // Ineligible assignment indicator
          isIneligible && 'ring-2 ring-red-300 ring-inset border-dashed',
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
        {/* Exclusion indicator */}
        {hasExclusions && !isLocked && (
          <span className="absolute -top-1 -right-1 text-[10px] leading-none" aria-label={`${excludedShifts.join(',')} 배제됨`}>
            ❌
          </span>
        )}
      </button>

      {/* Context Menu */}
      {showContextMenu && (
        <ContextMenu position={menuPosition} onClose={() => setShowContextMenu(false)}>
          <ContextMenuItem onClick={handleToggleLock}>
            {isLocked ? '🔓 고정 해제' : '🔒 고정'}
          </ContextMenuItem>
          {showExclusionSection && (
            <>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 border-t border-gray-100">
                배제
              </div>
              <div className="flex gap-1 px-3 py-1.5">
                {availableForExclusion.map((shiftType) => {
                  const isExcluded = excludedShifts.includes(shiftType);
                  const canToggle = isExcluded || excludedShifts.length < maxExclusions;
                  return (
                    <button
                      key={shiftType}
                      type="button"
                      onClick={() => onToggleExclusion?.(shiftType)}
                      disabled={!canToggle}
                      aria-pressed={isExcluded}
                      title={
                        isExcluded
                          ? `${shiftType} 배제 해제`
                          : canToggle
                            ? `${shiftType} 배제`
                            : `최대 ${maxExclusions}개까지 배제 가능`
                      }
                      className={cn(
                        'w-8 h-7 rounded border text-xs font-semibold transition-colors',
                        isExcluded
                          ? `${EXCLUSION_BUTTON_STYLES[shiftType]} line-through opacity-60`
                          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100',
                        !canToggle && !isExcluded && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {shiftType}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <ContextMenuItem onClick={handleReset}>
            ↺ 초기화
          </ContextMenuItem>
        </ContextMenu>
      )}
    </>
  );
}
