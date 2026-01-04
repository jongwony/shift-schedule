import type { SoftConstraintConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SoftConstraintSettingsProps {
  softConstraints: SoftConstraintConfig;
  onSoftConstraintsChange: (config: SoftConstraintConfig) => void;
}

type SoftConstraintId = keyof SoftConstraintConfig;

type ConstraintPerspective = 'worker' | 'manager';

interface ConstraintInfo {
  id: SoftConstraintId;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  perspective?: ConstraintPerspective;
}

const TIER_INFO: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: 'Tier 1 (건강/안전)', color: 'border-red-200 bg-red-50' },
  2: { label: 'Tier 2 (회복)', color: 'border-orange-200 bg-orange-50' },
  3: { label: 'Tier 3 (삶의질)', color: 'border-blue-200 bg-blue-50' },
};

const MANAGER_TIER_INFO = {
  color: 'border-violet-200 bg-violet-50',
  textColor: 'text-violet-700',
  bgColor: 'bg-violet-100',
};

// Worker perspective constraints (existing)
const WORKER_CONSTRAINTS: ConstraintInfo[] = [
  // Tier 1 - Health/Safety
  {
    id: 'maxConsecutiveWork',
    name: '연속근무상한',
    description: '연속 근무일 수 제한',
    tier: 1,
    perspective: 'worker',
  },
  {
    id: 'nightBlockPolicy',
    name: '야간블록정책',
    description: '단독 야간 근무 방지',
    tier: 1,
    perspective: 'worker',
  },
  // Tier 2 - Recovery
  {
    id: 'gradualShiftProgression',
    name: '점진적전환',
    description: 'D→N 직접 전환 방지',
    tier: 2,
    perspective: 'worker',
  },
  {
    id: 'maxSameShiftConsecutive',
    name: '동일근무연속상한',
    description: '동일 근무 5일 연속 방지',
    tier: 2,
    perspective: 'worker',
  },
  {
    id: 'restClustering',
    name: '휴식클러스터링',
    description: '휴식일 연속 배치',
    tier: 2,
    perspective: 'worker',
  },
  {
    id: 'postRestDayShift',
    name: '휴무후근무',
    description: '휴무 후 주간 복귀',
    tier: 2,
    perspective: 'worker',
  },
  // Tier 3 - Quality of Life
  {
    id: 'weekendFairness',
    name: '주말공정성',
    description: '주말 근무 공정 분배',
    tier: 3,
    perspective: 'worker',
  },
  {
    id: 'shiftContinuity',
    name: '근무연속성',
    description: '동일 근무 연속 유지',
    tier: 3,
    perspective: 'worker',
  },
];

// Manager perspective constraints (new)
const MANAGER_CONSTRAINTS: ConstraintInfo[] = [
  {
    id: 'maxPeriodOff',
    name: '주기당 OFF 상한',
    description: '28일 내 OFF 일수 제한',
    tier: 1,
    perspective: 'manager',
  },
  {
    id: 'maxConsecutiveOff',
    name: '연속 OFF 상한',
    description: '연속 OFF 일수 제한',
    tier: 1,
    perspective: 'manager',
  },
];

export function SoftConstraintSettings({
  softConstraints,
  onSoftConstraintsChange,
}: SoftConstraintSettingsProps) {
  const toggleConstraint = (id: SoftConstraintId) => {
    const current = softConstraints[id];
    onSoftConstraintsChange({
      ...softConstraints,
      [id]: {
        ...current,
        enabled: !current.enabled,
      },
    });
  };

  const updateMaxDays = (value: number) => {
    onSoftConstraintsChange({
      ...softConstraints,
      maxConsecutiveWork: {
        ...softConstraints.maxConsecutiveWork,
        maxDays: value,
      },
    });
  };

  const updateMinBlockSize = (value: number) => {
    onSoftConstraintsChange({
      ...softConstraints,
      nightBlockPolicy: {
        ...softConstraints.nightBlockPolicy,
        minBlockSize: value,
      },
    });
  };

  const updateMaxOff = (value: number) => {
    onSoftConstraintsChange({
      ...softConstraints,
      maxPeriodOff: {
        ...softConstraints.maxPeriodOff,
        maxOff: value,
      },
    });
  };

  const updateMaxConsecutiveOffDays = (value: number) => {
    onSoftConstraintsChange({
      ...softConstraints,
      maxConsecutiveOff: {
        ...softConstraints.maxConsecutiveOff,
        maxDays: value,
      },
    });
  };

  // Group worker constraints by tier
  const groupedWorkerConstraints = WORKER_CONSTRAINTS.reduce(
    (acc, constraint) => {
      if (!acc[constraint.tier]) {
        acc[constraint.tier] = [];
      }
      acc[constraint.tier].push(constraint);
      return acc;
    },
    {} as Record<number, ConstraintInfo[]>
  );

  const renderConstraintCard = (constraint: ConstraintInfo, isManager: boolean = false) => {
    const isEnabled = softConstraints[constraint.id].enabled;
    const showSlider =
      (constraint.id === 'maxConsecutiveWork' ||
        constraint.id === 'nightBlockPolicy' ||
        constraint.id === 'maxPeriodOff' ||
        constraint.id === 'maxConsecutiveOff') &&
      isEnabled;

    const cardColor = isManager
      ? isEnabled
        ? MANAGER_TIER_INFO.color
        : 'bg-gray-50 border-gray-100'
      : isEnabled
        ? TIER_INFO[constraint.tier].color
        : 'bg-gray-50 border-gray-100';

    return (
      <div
        key={constraint.id}
        className={cn(
          "p-3 rounded-lg border transition-colors",
          cardColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label
              htmlFor={`switch-${constraint.id}`}
              className={cn(
                "text-sm font-medium cursor-pointer",
                !isEnabled && "text-gray-400"
              )}
            >
              {constraint.name}
            </Label>
            <p
              className={cn(
                "text-xs",
                isEnabled ? "text-muted-foreground" : "text-gray-400"
              )}
            >
              {constraint.description}
            </p>
          </div>
          <Switch
            id={`switch-${constraint.id}`}
            checked={isEnabled}
            onCheckedChange={() => toggleConstraint(constraint.id)}
          />
        </div>

        {/* Slider for maxConsecutiveWork */}
        {showSlider && constraint.id === 'maxConsecutiveWork' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">최대 연속 근무일</Label>
              <span className="text-xs font-medium">
                {softConstraints.maxConsecutiveWork.maxDays}일
              </span>
            </div>
            <Slider
              value={softConstraints.maxConsecutiveWork.maxDays}
              min={3}
              max={7}
              step={1}
              onValueChange={updateMaxDays}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3일</span>
              <span>7일</span>
            </div>
          </div>
        )}

        {/* Slider for nightBlockPolicy */}
        {showSlider && constraint.id === 'nightBlockPolicy' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">최소 야간 블록 크기</Label>
              <span className="text-xs font-medium">
                {softConstraints.nightBlockPolicy.minBlockSize}일
              </span>
            </div>
            <Slider
              value={softConstraints.nightBlockPolicy.minBlockSize}
              min={2}
              max={3}
              step={1}
              onValueChange={updateMinBlockSize}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>2일</span>
              <span>3일</span>
            </div>
          </div>
        )}

        {/* Slider for maxPeriodOff */}
        {showSlider && constraint.id === 'maxPeriodOff' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">최대 OFF 일수</Label>
              <span className="text-xs font-medium">
                {softConstraints.maxPeriodOff.maxOff}일
              </span>
            </div>
            <Slider
              value={softConstraints.maxPeriodOff.maxOff}
              min={7}
              max={12}
              step={1}
              onValueChange={updateMaxOff}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>7일</span>
              <span>12일</span>
            </div>
          </div>
        )}

        {/* Slider for maxConsecutiveOff */}
        {showSlider && constraint.id === 'maxConsecutiveOff' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs">최대 연속 OFF</Label>
              <span className="text-xs font-medium">
                {softConstraints.maxConsecutiveOff.maxDays}일
              </span>
            </div>
            <Slider
              value={softConstraints.maxConsecutiveOff.maxDays}
              min={1}
              max={3}
              step={1}
              onValueChange={updateMaxConsecutiveOffDays}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1일</span>
              <span>3일</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">소프트 제약조건</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          자동 생성 시 선호도로 적용되는 제약조건입니다. 위반 시에도 스케줄 생성이 가능합니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Worker perspective section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">
            근무자 관점
          </h2>
          {([1, 2, 3] as const).map((tier) => (
            <div key={tier} className="space-y-3">
              <h3 className={cn(
                "text-sm font-medium px-2 py-1 rounded",
                tier === 1 && "text-red-700 bg-red-100",
                tier === 2 && "text-orange-700 bg-orange-100",
                tier === 3 && "text-blue-700 bg-blue-100"
              )}>
                {TIER_INFO[tier].label}
              </h3>
              <div className="space-y-2">
                {groupedWorkerConstraints[tier]?.map((constraint) =>
                  renderConstraintCard(constraint)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Manager perspective section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 border-b pb-2">
            관리자 관점
          </h2>
          <div className="space-y-3">
            <h3 className={cn(
              "text-sm font-medium px-2 py-1 rounded",
              MANAGER_TIER_INFO.textColor,
              MANAGER_TIER_INFO.bgColor
            )}>
              Tier 1 (운영 효율)
            </h3>
            <div className="space-y-2">
              {MANAGER_CONSTRAINTS.map((constraint) =>
                renderConstraintCard(constraint, true)
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
