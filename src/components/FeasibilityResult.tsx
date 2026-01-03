import type { FeasibilityResult as FeasibilityResultType, FeasibilityCheckResponse } from '@/types';
import { cn } from '@/lib/utils';

interface FeasibilityResultProps {
  result: FeasibilityResultType | null;
  /** Schedule completeness ratio (0.0 - 1.0) */
  completeness?: number;
  /** Pre-check result from backend API */
  preCheckResult?: FeasibilityCheckResponse | null;
}

const COMPLETENESS_THRESHOLD = 0.5;

export function FeasibilityResult({ result, completeness = 0, preCheckResult }: FeasibilityResultProps) {
  // Show progress state when schedule is below threshold
  if (result && completeness < COMPLETENESS_THRESHOLD) {
    const percentage = Math.round(completeness * 100);
    return (
      <div
        className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100"
              aria-hidden="true"
            >
              <svg className="w-7 h-7 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
            <div>
              <span className="block text-2xl font-bold text-blue-700">
                입력 중...
              </span>
              <span className="text-sm text-blue-600">
                {percentage}% 완료 (50% 이상 입력 시 검증 시작)
              </span>
            </div>
          </div>
          <div className="w-32">
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(percentage * 2, 100)}%` }}
              />
            </div>
            <span className="text-xs text-blue-600 mt-1 block text-right">{percentage}%</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="p-6 bg-gray-100 rounded-xl text-center text-gray-500 border-2 border-dashed border-gray-300"
        role="status"
        aria-live="polite"
      >
        <svg
          className="w-8 h-8 mx-auto mb-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span className="text-sm">근무표를 입력하면 타당성을 검사합니다</span>
      </div>
    );
  }

  const errorCount = result.violations.filter((v) => v.severity === 'error').length;
  const warningCount = result.violations.filter((v) => v.severity === 'warning').length;

  return (
    <div
      className={cn(
        'p-6 rounded-xl border-2 shadow-sm transition-all duration-300',
        result.feasible
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result.feasible ? (
            <>
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100"
                aria-hidden="true"
              >
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <span className="block text-2xl font-bold text-emerald-700">
                  POSSIBLE
                </span>
                <span className="text-sm text-emerald-600">
                  근무표 실행 가능
                </span>
              </div>
            </>
          ) : (
            <>
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100"
                aria-hidden="true"
              >
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <div>
                <span className="block text-2xl font-bold text-red-700">
                  IMPOSSIBLE
                </span>
                <span className="text-sm text-red-600">
                  제약 조건 위반 발견
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          {errorCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              오류 {errorCount}건
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              경고 {warningCount}건
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              위반 없음
            </span>
          )}
        </div>
      </div>

      {/* Pre-check analysis detail */}
      {preCheckResult && !preCheckResult.feasible && preCheckResult.reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="bg-red-100/50 rounded-lg p-4 font-mono text-sm text-red-800 space-y-1">
            {preCheckResult.reasons.map((reason, index) => (
              <div key={index} className={cn(
                reason.startsWith('💡') ? 'mt-2 pt-2 border-t border-red-200 text-red-700 font-semibold' : ''
              )}>
                {reason}
              </div>
            ))}
          </div>
          {preCheckResult.analysis && (
            <div className="mt-3 text-xs text-red-600 flex flex-wrap gap-x-4 gap-y-1">
              <span>직원: {preCheckResult.analysis.staffCount}명</span>
              <span>평일 최소: {preCheckResult.analysis.weekdayMinStaff}명</span>
              <span>주말 최소: {preCheckResult.analysis.weekendMinStaff}명</span>
              <span>주당 OFF: {preCheckResult.analysis.offDaysRequired}일</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
