import { useMemo } from 'react';
import { addDays, parseISO, format } from 'date-fns';
import type { Schedule, Staff, Violation, ShiftType, ShiftAssignment } from '@/types';
import { formatDateKorean, isWeekend } from '@/utils/dateUtils';
import { DAY_NAMES } from '@/utils/dayUtils';
import { countShiftsByType, countStaffByShiftPerDate } from '@/utils/shiftUtils';
import { getCellKey, type ImpactReason } from '@/utils/impactCalculator';
import { ShiftCell } from './ShiftCell';
import { cn } from '@/lib/utils';

interface ScheduleGridProps {
  schedule: Schedule;
  staff: Staff[];
  violations: Violation[];
  affectedCells: Map<string, ImpactReason>;
  onAssignmentChange: (staffId: string, date: string, shift: ShiftType) => void;
  onToggleLock?: (staffId: string, date: string) => void;
  onEditingCellChange?: (cell: { staffId: string; date: string } | null) => void;
  onHoverCellChange?: (cell: { staffId: string; date: string } | null) => void;
}

export function ScheduleGrid({
  schedule,
  staff,
  violations,
  affectedCells,
  onAssignmentChange,
  onToggleLock,
  onEditingCellChange,
  onHoverCellChange,
}: ScheduleGridProps) {
  // Generate 28 dates from schedule.startDate
  const dates = useMemo(() => {
    const result: { date: Date; dateString: string }[] = [];
    const start = parseISO(schedule.startDate);
    for (let i = 0; i < 28; i++) {
      const date = addDays(start, i);
      result.push({
        date,
        dateString: format(date, 'yyyy-MM-dd'),
      });
    }
    return result;
  }, [schedule.startDate]);

  // Build assignment lookup map: Map<staffId-date, ShiftAssignment>
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment>();
    for (const assignment of schedule.assignments) {
      map.set(`${assignment.staffId}-${assignment.date}`, assignment);
    }
    return map;
  }, [schedule.assignments]);

  // Build violation lookup map: Map<staffId-date, Violation[]>
  const violationMap = useMemo(() => {
    const map = new Map<string, Violation[]>();
    for (const violation of violations) {
      const { staffId, date, dates: violationDates } = violation.context;
      if (staffId && date) {
        const key = `${staffId}-${date}`;
        const existing = map.get(key) || [];
        existing.push(violation);
        map.set(key, existing);
      }
      if (staffId && violationDates) {
        for (const d of violationDates) {
          const key = `${staffId}-${d}`;
          const existing = map.get(key) || [];
          existing.push(violation);
          map.set(key, existing);
        }
      }
    }
    return map;
  }, [violations]);

  // Calculate per-date staff counts for footer summary
  const dateStrings = useMemo(() => dates.map((d) => d.dateString), [dates]);
  const perDateCounts = useMemo(
    () => countStaffByShiftPerDate(schedule.assignments, dateStrings),
    [schedule.assignments, dateStrings]
  );

  // Check if there are any assignments
  const hasAssignments = schedule.assignments.length > 0;

  if (staff.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center h-64 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        role="status"
      >
        <svg
          className="w-12 h-12 mb-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-base font-medium">직원을 추가해 주세요</p>
        <p className="text-sm text-gray-400 mt-1">직원관리 탭에서 직원을 추가할 수 있습니다</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="border-collapse min-w-full" role="grid" aria-label="근무표">
        <thead className="sticky top-0 z-10">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 bg-gray-50 p-2 border-b border-r border-gray-200 text-left text-sm font-semibold text-gray-900 min-w-[100px]"
            >
              직원
            </th>
            {dates.map(({ date, dateString }) => (
              <th
                key={dateString}
                scope="col"
                className={cn(
                  'p-2 border-b border-gray-200 text-center text-xs font-medium whitespace-nowrap',
                  isWeekend(date) ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-600'
                )}
              >
                {formatDateKorean(date)}
              </th>
            ))}
            {/* Summary columns - sticky right */}
            <th
              scope="col"
              className="sticky right-[120px] z-20 bg-amber-50 p-2 border-b border-l border-gray-200 text-center text-xs font-semibold text-amber-600 min-w-[40px]"
            >
              D
            </th>
            <th
              scope="col"
              className="sticky right-[80px] z-20 bg-blue-50 p-2 border-b border-gray-200 text-center text-xs font-semibold text-blue-600 min-w-[40px]"
            >
              E
            </th>
            <th
              scope="col"
              className="sticky right-[40px] z-20 bg-purple-50 p-2 border-b border-gray-200 text-center text-xs font-semibold text-purple-600 min-w-[40px]"
            >
              N
            </th>
            <th
              scope="col"
              className="sticky right-0 z-20 bg-gray-100 p-2 border-b border-gray-200 text-center text-xs font-semibold text-gray-500 min-w-[40px]"
            >
              OFF
            </th>
          </tr>
        </thead>
        <tbody>
          {staff.map((staffMember, rowIndex) => {
            const staffCounts = countShiftsByType(schedule.assignments, staffMember.id);
            const isLastRow = rowIndex === staff.length - 1;
            return (
              <tr key={staffMember.id} className="hover:bg-gray-50/50 transition-colors">
                <td
                  className={cn(
                    'sticky left-0 z-10 bg-white p-2 border-b border-r border-gray-200 text-sm font-medium min-w-[100px]',
                    isLastRow && 'border-b-0'
                  )}
                >
                  {(() => {
                    const juhuDay = schedule.staffJuhuDays?.find(
                      (j) => j.staffId === staffMember.id
                    )?.juhuDay;
                    return juhuDay !== undefined
                      ? `${staffMember.name} (${DAY_NAMES[juhuDay]})`
                      : staffMember.name;
                  })()}
                </td>
                {dates.map(({ date, dateString }) => {
                  const key = getCellKey(staffMember.id, dateString);
                  const assignment = assignmentMap.get(key);
                  const cellViolations = violationMap.get(key) || [];
                  const affectReason = affectedCells.get(key);
                  return (
                    <td
                      key={dateString}
                      className={cn(
                        'p-1 border-b border-gray-200',
                        isWeekend(date) && 'bg-gray-50',
                        isLastRow && 'border-b-0'
                      )}
                    >
                      <ShiftCell
                        shift={assignment?.shift ?? null}
                        violations={cellViolations}
                        isAffected={affectReason !== undefined}
                        affectReason={affectReason}
                        isLocked={assignment?.isLocked ?? false}
                        onChange={(shift) =>
                          onAssignmentChange(staffMember.id, dateString, shift)
                        }
                        onToggleLock={() => onToggleLock?.(staffMember.id, dateString)}
                        onFocus={() =>
                          onEditingCellChange?.({ staffId: staffMember.id, date: dateString })
                        }
                        onBlur={() => onEditingCellChange?.(null)}
                        onMouseEnter={() =>
                          onHoverCellChange?.({ staffId: staffMember.id, date: dateString })
                        }
                        onMouseLeave={() => onHoverCellChange?.(null)}
                      />
                    </td>
                  );
                })}
                {/* Summary cells - sticky right */}
                <td
                  className={cn(
                    'sticky right-[120px] z-10 bg-amber-50 p-2 border-b border-l border-gray-200 text-center text-sm font-medium text-amber-600 min-w-[40px]',
                    isLastRow && 'border-b-0'
                  )}
                >
                  {staffCounts.D}
                </td>
                <td
                  className={cn(
                    'sticky right-[80px] z-10 bg-blue-50 p-2 border-b border-gray-200 text-center text-sm font-medium text-blue-600 min-w-[40px]',
                    isLastRow && 'border-b-0'
                  )}
                >
                  {staffCounts.E}
                </td>
                <td
                  className={cn(
                    'sticky right-[40px] z-10 bg-purple-50 p-2 border-b border-gray-200 text-center text-sm font-medium text-purple-600 min-w-[40px]',
                    isLastRow && 'border-b-0'
                  )}
                >
                  {staffCounts.N}
                </td>
                <td
                  className={cn(
                    'sticky right-0 z-10 bg-gray-100 p-2 border-b border-gray-200 text-center text-sm font-medium text-gray-500 min-w-[40px]',
                    isLastRow && 'border-b-0'
                  )}
                >
                  {staffCounts.OFF}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {/* D count per date */}
          <tr className="bg-amber-50">
            <td className="sticky left-0 z-10 bg-amber-50 p-2 border-t border-r border-gray-200 text-sm font-medium text-amber-600">
              D 인원
            </td>
            {dates.map(({ date, dateString }) => {
              const counts = perDateCounts.get(dateString);
              return (
                <td
                  key={dateString}
                  className={cn(
                    'p-2 border-t border-gray-200 text-center text-sm font-medium text-amber-600',
                    isWeekend(date) && 'bg-amber-100/50'
                  )}
                >
                  {counts?.D ?? 0}
                </td>
              );
            })}
            <td className="sticky right-[120px] z-10 bg-amber-100 p-2 border-t border-l border-gray-200" />
            <td className="sticky right-[80px] z-10 bg-blue-50 p-2 border-t border-gray-200" />
            <td className="sticky right-[40px] z-10 bg-purple-50 p-2 border-t border-gray-200" />
            <td className="sticky right-0 z-10 bg-gray-100 p-2 border-t border-gray-200" />
          </tr>
          {/* E count per date */}
          <tr className="bg-blue-50">
            <td className="sticky left-0 z-10 bg-blue-50 p-2 border-r border-gray-200 text-sm font-medium text-blue-600">
              E 인원
            </td>
            {dates.map(({ date, dateString }) => {
              const counts = perDateCounts.get(dateString);
              return (
                <td
                  key={dateString}
                  className={cn(
                    'p-2 text-center text-sm font-medium text-blue-600',
                    isWeekend(date) && 'bg-blue-100/50'
                  )}
                >
                  {counts?.E ?? 0}
                </td>
              );
            })}
            <td className="sticky right-[120px] z-10 bg-amber-50 p-2 border-l border-gray-200" />
            <td className="sticky right-[80px] z-10 bg-blue-100 p-2 border-gray-200" />
            <td className="sticky right-[40px] z-10 bg-purple-50 p-2 border-gray-200" />
            <td className="sticky right-0 z-10 bg-gray-100 p-2 border-gray-200" />
          </tr>
          {/* N count per date */}
          <tr className="bg-purple-50">
            <td className="sticky left-0 z-10 bg-purple-50 p-2 border-r border-gray-200 text-sm font-medium text-purple-600">
              N 인원
            </td>
            {dates.map(({ date, dateString }) => {
              const counts = perDateCounts.get(dateString);
              return (
                <td
                  key={dateString}
                  className={cn(
                    'p-2 text-center text-sm font-medium text-purple-600',
                    isWeekend(date) && 'bg-purple-100/50'
                  )}
                >
                  {counts?.N ?? 0}
                </td>
              );
            })}
            <td className="sticky right-[120px] z-10 bg-amber-50 p-2 border-l border-gray-200" />
            <td className="sticky right-[80px] z-10 bg-blue-50 p-2 border-gray-200" />
            <td className="sticky right-[40px] z-10 bg-purple-100 p-2 border-gray-200" />
            <td className="sticky right-0 z-10 bg-gray-100 p-2 border-gray-200" />
          </tr>
        </tfoot>
      </table>
        {!hasAssignments && (
          <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
            각 셀을 클릭하여 근무를 배정하세요 (D: 데이, E: 이브닝, N: 나이트, OFF: 휴무)
          </div>
        )}
      </div>
      {/* Scroll indicator - only on mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none sm:hidden" />
    </div>
  );
}
