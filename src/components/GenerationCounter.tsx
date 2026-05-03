/**
 * Compact badge showing remaining generation count or plan status.
 * Displayed in the header bar for authenticated users.
 */

import type { Plan } from '@/types/auth';

interface GenerationCounterProps {
  remaining: number | null;
  plan: Plan;
  dayPassExpiry?: string | null;
}

export function GenerationCounter({ remaining, plan, dayPassExpiry }: GenerationCounterProps) {
  if (remaining === null && plan === 'free') return null;

  if (plan === 'unlimited') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-violet-100 text-violet-800 border border-violet-200">
        테스트 계정 — 무제한
      </span>
    );
  }

  if (plan === 'daypass') {
    if (dayPassExpiry == null) {
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200"
          title="첫 자동 생성 시점부터 24시간 카운트가 시작됩니다"
        >
          Day Pass · 활성화 대기
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
        Day Pass
      </span>
    );
  }

  // Free plan with remaining count
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
      남은 무료 생성: {remaining}회
    </span>
  );
}
