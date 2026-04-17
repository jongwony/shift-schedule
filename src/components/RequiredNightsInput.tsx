import { useMemo } from 'react';
import type { Staff } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { splitWindowByMonth } from '@/utils/dateUtils';

interface RequiredNightsInputProps {
  staff: Staff[];
  startDate: string;
  requiredNights: Record<string, number>;
  onRequiredNightsChange: (requiredNights: Record<string, number>) => void;
}

export function RequiredNightsInput({
  staff,
  startDate,
  requiredNights,
  onRequiredNightsChange,
}: RequiredNightsInputProps) {
  const { frontDays, frontEndDate } = useMemo(
    () => splitWindowByMonth(startDate, 28),
    [startDate]
  );

  const hasFrontPortion = frontDays > 0;
  const inputMax = frontDays;

  const clamp = (value: number) => Math.max(0, Math.min(inputMax, value));

  const updateStaffNights = (staffId: string, value: number) => {
    onRequiredNightsChange({
      ...requiredNights,
      [staffId]: clamp(value),
    });
  };

  const applyAll = (value: number) => {
    const clamped = clamp(value);
    const updated: Record<string, number> = {};
    for (const s of staff) {
      updated[s.id] = clamped;
    }
    onRequiredNightsChange(updated);
  };

  if (staff.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">필요나이트</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>필요나이트 설정</DialogTitle>
          <DialogDescription>
            {hasFrontPortion ? (
              <>
                윈도우 앞부분(<span className="font-medium">{startDate} ~ {frontEndDate}</span>, {frontDays}일)에
                배치할 나이트(N) 개수를 직원별로 입력하세요. 이 구간은 이전 달의 뒷부분에 해당합니다.
              </>
            ) : (
              <>
                윈도우가 월 1일에 시작하여 앞부분(이전 달 뒷부분)이 없습니다.
                이번 윈도우는 필요나이트를 설정할 필요가 없습니다.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Bulk apply */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="text-sm text-muted-foreground whitespace-nowrap">일괄 적용</span>
            <Input
              type="number"
              min={0}
              max={inputMax}
              disabled={!hasFrontPortion}
              className="w-20 h-8 text-center text-sm"
              placeholder="0"
              onChange={(e) => applyAll(Number(e.target.value))}
            />
            {hasFrontPortion && (
              <span className="text-xs text-muted-foreground">최대 {inputMax}</span>
            )}
          </div>
          {/* Per-staff inputs */}
          {staff.map((staffMember) => (
            <div key={staffMember.id} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{staffMember.name}</span>
              <Input
                type="number"
                min={0}
                max={inputMax}
                disabled={!hasFrontPortion}
                className="w-20 h-8 text-center text-sm"
                value={requiredNights[staffMember.id] ?? 0}
                onChange={(e) => updateStaffNights(staffMember.id, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
