import { useMemo } from 'react';
import { subDays, parseISO, format } from 'date-fns';
import type { Staff, ShiftAssignment, ShiftType } from '@/types';
import { formatDateKorean } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PreviousPeriodInputProps {
  staff: Staff[];
  previousPeriodEnd: ShiftAssignment[];
  onPreviousPeriodChange: (assignments: ShiftAssignment[]) => void;
  startDate: string;
}

const SHIFT_CONFIG: Record<ShiftType, { bg: string; text: string; label: string }> = {
  D: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'D' },
  E: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'E' },
  N: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'N' },
  OFF: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'OFF' },
};

const SHIFTS: ShiftType[] = ['D', 'E', 'N', 'OFF'];

export function PreviousPeriodInput({
  staff,
  previousPeriodEnd,
  onPreviousPeriodChange,
  startDate,
}: PreviousPeriodInputProps) {
  // Calculate the 3 days before period start
  const previousDates = useMemo(() => {
    const start = parseISO(startDate);
    return [
      { date: subDays(start, 3), dateString: format(subDays(start, 3), 'yyyy-MM-dd') },
      { date: subDays(start, 2), dateString: format(subDays(start, 2), 'yyyy-MM-dd') },
      { date: subDays(start, 1), dateString: format(subDays(start, 1), 'yyyy-MM-dd') },
    ];
  }, [startDate]);

  // Build assignment lookup map
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftType>();
    for (const assignment of previousPeriodEnd) {
      map.set(`${assignment.staffId}-${assignment.date}`, assignment.shift);
    }
    return map;
  }, [previousPeriodEnd]);

  const handleShiftChange = (staffId: string, date: string, shift: ShiftType) => {
    const existingIndex = previousPeriodEnd.findIndex(
      (a) => a.staffId === staffId && a.date === date
    );

    let newAssignments: ShiftAssignment[];
    if (existingIndex >= 0) {
      newAssignments = [...previousPeriodEnd];
      newAssignments[existingIndex] = { staffId, date, shift };
    } else {
      newAssignments = [...previousPeriodEnd, { staffId, date, shift }];
    }
    onPreviousPeriodChange(newAssignments);
  };

  const getShift = (staffId: string, date: string): ShiftType | null => {
    return assignmentMap.get(`${staffId}-${date}`) ?? null;
  };

  if (staff.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">이전 기간 입력</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>이전 기간 근무 입력</DialogTitle>
          <DialogDescription>
            기간 시작 전 3일간의 근무를 입력하세요. 연속 나이트, N-OFF-D 패턴 검사에 사용됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-gray-200 text-left text-sm font-medium">
                  직원
                </th>
                {previousDates.map(({ date, dateString }) => (
                  <th
                    key={dateString}
                    className="p-2 border border-gray-200 text-center text-xs font-medium"
                  >
                    {formatDateKorean(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((staffMember) => (
                <tr key={staffMember.id}>
                  <td className="p-2 border border-gray-200 text-sm font-medium">
                    {staffMember.name}
                  </td>
                  {previousDates.map(({ dateString }) => {
                    const currentShift = getShift(staffMember.id, dateString);
                    return (
                      <td
                        key={dateString}
                        className="p-1 border border-gray-200"
                      >
                        <div className="flex gap-1 justify-center">
                          {SHIFTS.map((shift) => {
                            const config = SHIFT_CONFIG[shift];
                            const isSelected = currentShift === shift;
                            return (
                              <button
                                key={shift}
                                type="button"
                                onClick={() =>
                                  handleShiftChange(staffMember.id, dateString, shift)
                                }
                                className={cn(
                                  'px-2 py-1 text-xs font-medium rounded transition-all',
                                  isSelected
                                    ? `${config.bg} ${config.text} ring-2 ring-primary`
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                )}
                              >
                                {config.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
