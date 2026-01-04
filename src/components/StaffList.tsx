import { useState } from 'react';
import type { Staff, DayOfWeek } from '@/types';
import { DAY_NAMES } from '@/utils/dayUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StaffListProps {
  staff: Staff[];
  onAddStaff: (name: string, juhuDay: DayOfWeek) => void;
  onRemoveStaff: (id: string) => void;
  onUpdateStaff: (id: string, updates: Partial<Pick<Staff, 'name' | 'juhuDay'>>) => void;
}

export function StaffList({
  staff,
  onAddStaff,
  onRemoveStaff,
  onUpdateStaff,
}: StaffListProps) {
  const [newName, setNewName] = useState('');
  const [newJuhuDay, setNewJuhuDay] = useState<DayOfWeek>(0);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateName = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return '이름을 입력해 주세요';
    }
    if (trimmed.length > 20) {
      return '이름은 20자 이하이어야 합니다';
    }
    if (staff.some((s) => s.name === trimmed)) {
      return '이미 존재하는 이름입니다';
    }
    return null;
  };

  const handleAdd = () => {
    const error = validateName(newName);
    if (error) {
      setNameError(error);
      return;
    }
    onAddStaff(newName.trim(), newJuhuDay);
    setNewName('');
    setNewJuhuDay(0);
    setNameError(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    if (nameError) {
      setNameError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">직원 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <Label htmlFor="staff-name">이름</Label>
              <Input
                id="staff-name"
                value={newName}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                placeholder="직원 이름"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'staff-name-error' : undefined}
                className={cn(nameError && 'border-red-500 focus-visible:ring-red-500')}
              />
              {nameError && (
                <p id="staff-name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            <div className="w-24">
              <Label htmlFor="juhu-day">주휴일</Label>
              <select
                id="juhu-day"
                value={newJuhuDay}
                onChange={(e) => setNewJuhuDay(Number(e.target.value) as DayOfWeek)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => (
                  <option key={day} value={day}>
                    {DAY_NAMES[day]}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleAdd} aria-label="직원 추가">
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">직원 목록 ({staff.length}명)</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-gray-500 text-center py-4">직원을 추가해 주세요</p>
          ) : (
            <ul className="space-y-2">
              {staff.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-sm text-gray-500">
                      주휴: {DAY_NAMES[s.juhuDay]}요일
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <select
                      value={s.juhuDay}
                      onChange={(e) =>
                        onUpdateStaff(s.id, {
                          juhuDay: Number(e.target.value) as DayOfWeek,
                        })
                      }
                      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    >
                      {([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((day) => (
                        <option key={day} value={day}>
                          {DAY_NAMES[day]}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemoveStaff(s.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
