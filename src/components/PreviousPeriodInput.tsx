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

export function PreviousPeriodInput({
  staff,
  previousPeriodEnd,
  onPreviousPeriodChange,
  startDate,
}: PreviousPeriodInputProps) {
  // Calculate the 7 days before period start
  const previousDates = useMemo(() => {
    const start = parseISO(startDate);
    return Array.from({ length: 7 }, (_, i) => {
      const daysBack = 7 - i; // 7, 6, 5, 4, 3, 2, 1
      const date = subDays(start, daysBack);
      return { date, dateString: format(date, 'yyyy-MM-dd') };
    });
  }, [startDate]);

  // Build assignment lookup map
  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftType>();
    for (const assignment of previousPeriodEnd) {
      map.set(`${assignment.staffId}-${assignment.date}`, assignment.shift);
    }
    return map;
  }, [previousPeriodEnd]);

  // Cycle through shifts: null → D → E → N → OFF → null
  const cycleShift = (staffId: string, date: string) => {
    const currentShift = getShift(staffId, date);
    const cycleOrder: (ShiftType | null)[] = [null, 'D', 'E', 'N', 'OFF'];
    const currentIndex = cycleOrder.indexOf(currentShift);
    const nextIndex = (currentIndex + 1) % cycleOrder.length;
    const nextShift = cycleOrder[nextIndex];

    if (nextShift === null) {
      // Remove assignment
      onPreviousPeriodChange(
        previousPeriodEnd.filter((a) => !(a.staffId === staffId && a.date === date))
      );
    } else {
      const existingIndex = previousPeriodEnd.findIndex(
        (a) => a.staffId === staffId && a.date === date
      );
      if (existingIndex >= 0) {
        const newAssignments = [...previousPeriodEnd];
        newAssignments[existingIndex] = { staffId, date, shift: nextShift };
        onPreviousPeriodChange(newAssignments);
      } else {
        onPreviousPeriodChange([...previousPeriodEnd, { staffId, date, shift: nextShift }]);
      }
    }
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>이전 기간 근무 입력</DialogTitle>
          <DialogDescription>
            기간 시작 전 7일간의 근무를 입력하세요. 클릭하여 순환 (D→E→N→OFF→빈값).
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
                    const config = currentShift ? SHIFT_CONFIG[currentShift] : null;
                    return (
                      <td
                        key={dateString}
                        className="p-1 border border-gray-200"
                      >
                        <button
                          type="button"
                          onClick={() => cycleShift(staffMember.id, dateString)}
                          className={cn(
                            'w-full h-8 text-xs font-medium rounded transition-all',
                            config
                              ? `${config.bg} ${config.text}`
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          )}
                        >
                          {config?.label ?? '-'}
                        </button>
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
