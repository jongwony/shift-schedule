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
  const updateStaffNights = (staffId: string, value: number) => {
    onRequiredNightsChange({
      ...requiredNights,
      [staffId]: value,
    });
  };

  const applyAll = (value: number) => {
    const updated: Record<string, number> = {};
    for (const s of staff) {
      updated[s.id] = value;
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
            28일 기간 동안 각 직원에게 필요한 나이트(N) 근무 횟수를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Bulk apply */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <span className="text-sm text-muted-foreground whitespace-nowrap">일괄 적용</span>
            <Input
              type="number"
              min={0}
              max={28}
              className="w-20 h-8 text-center text-sm"
              placeholder="0"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0 && val <= 28) {
                  applyAll(val);
                }
              }}
            />
          </div>
          {/* Per-staff inputs */}
          {staff.map((staffMember) => (
            <div key={staffMember.id} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{staffMember.name}</span>
              <Input
                type="number"
                min={0}
                max={28}
                className="w-20 h-8 text-center text-sm"
                value={requiredNights[staffMember.id] ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val >= 0 && val <= 28) {
                    updateStaffNights(staffMember.id, val);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
