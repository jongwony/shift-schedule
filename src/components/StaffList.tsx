import { useState } from 'react';
import type { Staff } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface StaffListProps {
  staff: Staff[];
  onAddStaff: (name: string) => void;
  onRemoveStaff: (id: string) => void;
}

export function StaffList({
  staff,
  onAddStaff,
  onRemoveStaff,
}: StaffListProps) {
  const [newName, setNewName] = useState('');
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
    onAddStaff(newName.trim());
    setNewName('');
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
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{s.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemoveStaff(s.id)}
                  >
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
