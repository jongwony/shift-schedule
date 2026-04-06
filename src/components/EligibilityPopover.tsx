import type { EligibleShift } from '@/types';
import { ContextMenu } from './ContextMenu';
import { cn } from '@/lib/utils';

interface EligibilityPopoverProps {
  position: { x: number; y: number };
  staffName: string;
  eligibleShifts: EligibleShift[];
  onUpdate: (shifts: EligibleShift[]) => void;
  onClose: () => void;
}

const CANONICAL_ORDER: EligibleShift[] = ['D', 'E', 'N'];

const SHIFT_BUTTONS: { shift: EligibleShift; label: string; activeClass: string }[] = [
  { shift: 'D', label: 'D', activeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { shift: 'E', label: 'E', activeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { shift: 'N', label: 'N', activeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
];

export function EligibilityPopover({
  position,
  staffName,
  eligibleShifts,
  onUpdate,
  onClose,
}: EligibilityPopoverProps) {
  const handleToggle = (shift: EligibleShift) => {
    const isActive = eligibleShifts.includes(shift);
    if (isActive && eligibleShifts.length <= 1) return; // min 1 required
    const next = isActive
      ? eligibleShifts.filter((s) => s !== shift)
      : [...eligibleShifts, shift].sort(
          (a, b) => CANONICAL_ORDER.indexOf(a) - CANONICAL_ORDER.indexOf(b)
        );
    onUpdate(next);
  };

  return (
    <ContextMenu position={position} onClose={onClose}>
      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        {staffName} - 가능 근무
      </div>
      <div className="flex gap-1.5 px-3 py-2">
        {SHIFT_BUTTONS.map(({ shift, label, activeClass }) => {
          const isActive = eligibleShifts.includes(shift);
          const isLastActive = isActive && eligibleShifts.length <= 1;
          return (
            <button
              key={shift}
              type="button"
              onClick={() => handleToggle(shift)}
              disabled={isLastActive}
              title={isLastActive ? '최소 1개 근무 유형이 필요합니다' : undefined}
              className={cn(
                'w-10 h-8 rounded border text-sm font-semibold transition-colors',
                isActive
                  ? activeClass
                  : 'bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100',
                isLastActive && 'cursor-not-allowed opacity-60'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </ContextMenu>
  );
}
