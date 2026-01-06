import type { ConstraintConfig, ConstraintSeverity } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SoftConstraintSettings } from '@/components/SoftConstraintSettings';
import { cn } from '@/lib/utils';

interface ConfigPanelProps {
  config: ConstraintConfig;
  onConfigChange: (config: ConstraintConfig) => void;
}

type ConstraintKey = keyof ConstraintConfig['enabledConstraints'];

const CONSTRAINT_LABELS: Record<ConstraintKey, string> = {
  shiftOrder: '역순 금지 (D-E-N 순서)',
  nightOffDay: 'N-OFF-D 금지',
  consecutiveNight: '연속 나이트 제한',
  monthlyNight: '월간 나이트 요구',
  staffing: '최소 인원 요구',
  weeklyOff: '주간 휴무',
};

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const updateConfig = (updates: Partial<ConstraintConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleConstraint = (key: ConstraintKey) => {
    onConfigChange({
      ...config,
      enabledConstraints: {
        ...config.enabledConstraints,
        [key]: !config.enabledConstraints[key],
      },
    });
  };

  const toggleSeverity = (key: ConstraintKey) => {
    const currentSeverity = config.constraintSeverity?.[key] ?? 'hard';
    const newSeverity: ConstraintSeverity = currentSeverity === 'hard' ? 'soft' : 'hard';
    onConfigChange({
      ...config,
      constraintSeverity: {
        ...config.constraintSeverity,
        [key]: newSeverity,
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">근무 시간 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weekly-work-hours">주간 근무시간</Label>
              <Input
                id="weekly-work-hours"
                type="number"
                min={8}
                max={56}
                step={8}
                value={config.weeklyWorkHours}
                onChange={(e) =>
                  updateConfig({ weeklyWorkHours: Number(e.target.value) })
                }
              />
              <span className="text-xs text-muted-foreground">
                최소 {7 - Math.ceil(config.weeklyWorkHours / 8)}일 휴무 필요
              </span>
            </div>
            <div>
              <Label htmlFor="max-consecutive">연속 나이트 최대 (일)</Label>
              <Input
                id="max-consecutive"
                type="number"
                min={1}
                max={7}
                value={config.maxConsecutiveNights}
                onChange={(e) =>
                  updateConfig({ maxConsecutiveNights: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="monthly-nights">월간 나이트 요구량 (회)</Label>
              <Input
                id="monthly-nights"
                type="number"
                min={0}
                max={28}
                value={config.monthlyNightsRequired}
                onChange={(e) =>
                  updateConfig({ monthlyNightsRequired: Number(e.target.value) })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">평일 최소인원</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weekday-day">데이 (D)</Label>
              <Input
                id="weekday-day"
                type="number"
                min={0}
                value={config.weekdayStaffing.day.min}
                onChange={(e) =>
                  updateConfig({
                    weekdayStaffing: {
                      ...config.weekdayStaffing,
                      day: {
                        ...config.weekdayStaffing.day,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="weekday-evening">이브닝 (E)</Label>
              <Input
                id="weekday-evening"
                type="number"
                min={0}
                value={config.weekdayStaffing.evening.min}
                onChange={(e) =>
                  updateConfig({
                    weekdayStaffing: {
                      ...config.weekdayStaffing,
                      evening: {
                        ...config.weekdayStaffing.evening,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="weekday-night">나이트 (N)</Label>
              <Input
                id="weekday-night"
                type="number"
                min={0}
                value={config.weekdayStaffing.night.min}
                onChange={(e) =>
                  updateConfig({
                    weekdayStaffing: {
                      ...config.weekdayStaffing,
                      night: {
                        ...config.weekdayStaffing.night,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">주말 최소인원</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weekend-day">데이 (D)</Label>
              <Input
                id="weekend-day"
                type="number"
                min={0}
                value={config.weekendStaffing.day.min}
                onChange={(e) =>
                  updateConfig({
                    weekendStaffing: {
                      ...config.weekendStaffing,
                      day: {
                        ...config.weekendStaffing.day,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="weekend-evening">이브닝 (E)</Label>
              <Input
                id="weekend-evening"
                type="number"
                min={0}
                value={config.weekendStaffing.evening.min}
                onChange={(e) =>
                  updateConfig({
                    weekendStaffing: {
                      ...config.weekendStaffing,
                      evening: {
                        ...config.weekendStaffing.evening,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="weekend-night">나이트 (N)</Label>
              <Input
                id="weekend-night"
                type="number"
                min={0}
                value={config.weekendStaffing.night.min}
                onChange={(e) =>
                  updateConfig({
                    weekendStaffing: {
                      ...config.weekendStaffing,
                      night: {
                        ...config.weekendStaffing.night,
                        min: Number(e.target.value),
                      },
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">제약조건 설정</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Hard: 위반 시 스케줄 무효 (빨간색) / Soft: 권고사항 (노란색)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(Object.keys(CONSTRAINT_LABELS) as ConstraintKey[]).map((key) => {
              const isEnabled = config.enabledConstraints[key];
              const severity = config.constraintSeverity?.[key] ?? 'hard';
              const isHard = severity === 'hard';

              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg border transition-colors',
                    isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  )}
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => toggleConstraint(key)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className={cn('text-sm', !isEnabled && 'text-gray-400')}>
                      {CONSTRAINT_LABELS[key]}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleSeverity(key)}
                    disabled={!isEnabled}
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full transition-colors',
                      isEnabled
                        ? isHard
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {isHard ? 'Hard' : 'Soft'}
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SoftConstraintSettings
        softConstraints={config.softConstraints}
        onSoftConstraintsChange={(softConstraints) =>
          onConfigChange({ ...config, softConstraints })
        }
      />
    </div>
  );
}
