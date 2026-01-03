import type { ShiftType, Violation } from '@/types';
import type { ImpactReason } from '@/utils/impactCalculator';
import { cn } from '@/lib/utils';

interface ShiftCellProps {
  shift: ShiftType | null;
  violations: Violation[];
  isAffected?: boolean;
  affectReason?: ImpactReason;
  onChange: (shift: ShiftType) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const IMPACT_STYLES: Record<ImpactReason, { bg: string; label: string }> = {
  staffing: { bg: 'bg-blue-50', label: '같은 날짜 인원 수 영향' },
  sequence: { bg: 'bg-orange-50', label: '연속 근무 규칙 영향' },
  juhu: { bg: 'bg-purple-50', label: '주후 휴무 규칙 영향' },
};

const SHIFT_CONFIG: Record<ShiftType, { bg: string; hover: string; text: string; icon: string; label: string }> = {
  D: { bg: 'bg-amber-100', hover: 'hover:bg-amber-200', text: 'text-amber-800', icon: '\u2600', label: '데이' },
  E: { bg: 'bg-blue-100', hover: 'hover:bg-blue-200', text: 'text-blue-800', icon: '\u263D', label: '이브닝' },
  N: { bg: 'bg-indigo-100', hover: 'hover:bg-indigo-200', text: 'text-indigo-800', icon: '\u2605', label: '나이트' },
  OFF: { bg: 'bg-slate-100', hover: 'hover:bg-slate-200', text: 'text-slate-600', icon: '\u2014', label: '휴무' },
};

const SHIFT_CYCLE: (ShiftType | null)[] = [null, 'D', 'E', 'N', 'OFF'];

export function ShiftCell({
  shift,
  violations,
  isAffected,
  affectReason,
  onChange,
  onFocus,
  onBlur,
  onMouseEnter,
  onMouseLeave,
}: ShiftCellProps) {
  const hasError = violations.some((v) => v.severity === 'error');
  const hasWarning = violations.some((v) => v.severity === 'warning');
  const violationMessages = violations.map((v) => v.message).join('\n');
  const impactStyle = affectReason ? IMPACT_STYLES[affectReason] : null;

  const handleClick = () => {
    const currentIndex = SHIFT_CYCLE.indexOf(shift);
    const nextIndex = (currentIndex + 1) % SHIFT_CYCLE.length;
    const nextShift = SHIFT_CYCLE[nextIndex];
    if (nextShift !== null) {
      onChange(nextShift);
    } else {
      // Skip null, go to D
      onChange('D');
    }
  };

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
    <button
      type="button"
      onClick={handleClick}
      onFocus={onFocus}
      onBlur={onBlur}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={title}
      aria-label={ariaLabel}
      className={cn(
        'w-12 h-10 flex items-center justify-center text-sm font-medium rounded border cursor-pointer',
        'transition-all duration-150 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'active:scale-95',
        // Base background (affected overrides if no error/warning)
        isAffected && impactStyle && !hasError && !hasWarning ? impactStyle.bg : config ? config.bg : 'bg-gray-50 hover:bg-gray-100',
        config ? config.hover : '',
        config ? config.text : 'text-gray-400',
        // Affected state: dashed border
        isAffected && !hasError && !hasWarning && 'border-dashed border-2',
        // Error/warning states (override affected)
        hasError && 'bg-red-100 border-red-400 ring-2 ring-red-500 hover:bg-red-200',
        hasWarning && !hasError && 'border-yellow-400 ring-2 ring-yellow-500 hover:bg-yellow-100',
        !hasError && !hasWarning && !isAffected && 'border-gray-200 hover:border-gray-300',
        // Affected border colors by reason
        isAffected && !hasError && !hasWarning && affectReason === 'staffing' && 'border-blue-400',
        isAffected && !hasError && !hasWarning && affectReason === 'sequence' && 'border-orange-400',
        isAffected && !hasError && !hasWarning && affectReason === 'juhu' && 'border-purple-400'
      )}
    >
      {config ? (
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span>{config.icon}</span>
          <span>{shift}</span>
        </span>
      ) : (
        <span className="text-gray-300" aria-hidden="true">-</span>
      )}
    </button>
  );
}
