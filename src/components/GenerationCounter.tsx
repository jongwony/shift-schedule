/**
 * Compact badge showing remaining generation count or plan status.
 * Displayed in the header bar for authenticated users.
 */

import type { Plan } from '@/types/auth';

interface GenerationCounterProps {
  remaining: number | null;
  plan: Plan;
}

export function GenerationCounter({ remaining, plan }: GenerationCounterProps) {
  if (remaining === null && plan === 'free') return null;

  if (plan === 'annual') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        Annual
      </span>
    );
  }

  if (plan === 'daypass') {
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
