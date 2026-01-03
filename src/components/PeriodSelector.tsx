import { useMemo } from 'react';
import { addDays, parseISO, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateKorean } from '@/utils/dateUtils';

interface PeriodSelectorProps {
  startDate: string;
  onStartDateChange: (date: string) => void;
}

export function PeriodSelector({ startDate, onStartDateChange }: PeriodSelectorProps) {
  const endDate = useMemo(() => {
    const start = parseISO(startDate);
    const end = addDays(start, 27);
    return {
      formatted: formatDateKorean(end),
      iso: format(end, 'yyyy-MM-dd'),
    };
  }, [startDate]);

  const startDateFormatted = useMemo(() => {
    return formatDateKorean(parseISO(startDate));
  }, [startDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">근무 기간</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="start-date">시작일</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pb-2 text-sm text-gray-600">
            <span>{startDateFormatted}</span>
            <span>~</span>
            <span>{endDate.formatted}</span>
            <span className="text-gray-400">(4주, 28일)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
