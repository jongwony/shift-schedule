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

// requiredNights applies over the FULL scheduling window (consistent with every
// other criterion); calendar month length 28-31 does not change the target.
const WINDOW_DAYS = 28;

interface RequiredNightsInputProps {
  staff: Staff[];
  requiredNights: Record<string, number>;
  onRequiredNightsChange: (requiredNights: Record<string, number>) => void;
}

export function RequiredNightsInput({
  staff,
  requiredNights,
  onRequiredNightsChange,
}: RequiredNightsInputProps) {
  const inputMax = WINDOW_DAYS;

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
            윈도우 전체(28일)에 배치할 나이트(N) 개수를 직원별로 입력하세요.
            솔버가 이 개수를 정확히 충족하도록 강제합니다.
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
              className="w-20 h-8 text-center text-sm"
              placeholder="0"
              onChange={(e) => applyAll(Number(e.target.value))}
            />
            <span className="text-xs text-muted-foreground">최대 {inputMax}</span>
          </div>
          {/* Per-staff inputs */}
          {staff.map((staffMember) => (
            <div key={staffMember.id} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{staffMember.name}</span>
              <Input
                type="number"
                min={0}
                max={inputMax}
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
