import { useState } from 'react';
import type { Violation } from '@/types';
import { constraintRegistry } from '@/constraints';
import type { ConstraintSeverityType } from '@/constraints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Map constraint IDs to their severity types (hard/soft).
 * Built from the constraint registry.
 */
const constraintSeverityMap: Record<string, ConstraintSeverityType> = Object.fromEntries(
  constraintRegistry.map((c) => [c.id, c.severityType])
);

interface ViolationListProps {
  violations: Violation[];
  editingCell?: { staffId: string; date: string } | null;
  onViolationClick?: (violation: Violation) => void;
  showAllViolations?: boolean;
  onToggleShowAll?: () => void;
}

/**
 * Check if a violation is relevant to the currently editing cell.
 */
function isViolationRelevantToEditingCell(
  violation: Violation,
  editingCell: { staffId: string; date: string }
): boolean {
  const { staffId, date, dates } = violation.context;

  // If violation has a staffId, it must match
  if (staffId && staffId !== editingCell.staffId) {
    return false;
  }

  // Check single date
  if (date && date === editingCell.date) {
    return true;
  }

  // Check date range
  if (dates && dates.includes(editingCell.date)) {
    return true;
  }

  // For violations without specific date context (e.g., monthly totals),
  // show if staffId matches
  if (!date && !dates && staffId === editingCell.staffId) {
    return true;
  }

  return false;
}

export function ViolationList({
  violations,
  editingCell,
  onViolationClick,
  showAllViolations = false,
  onToggleShowAll,
}: ViolationListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (violations.length === 0) {
    return null;
  }

  // Separate violations by constraint severity type (hard/soft)
  const hardViolations = violations.filter(
    (v) => constraintSeverityMap[v.constraintId] === 'hard'
  );
  const softViolations = violations.filter(
    (v) => constraintSeverityMap[v.constraintId] === 'soft'
  );

  // Filter soft violations: show all if toggled, otherwise only when relevant cell is being edited
  const visibleSoftViolations = showAllViolations
    ? softViolations
    : editingCell
      ? softViolations.filter((v) => isViolationRelevantToEditingCell(v, editingCell))
      : [];

  const renderViolation = (violation: Violation, index: number) => (
    <li
      key={`${violation.constraintId}-${violation.context.staffId}-${violation.context.date}-${index}`}
      className={cn(
        'p-3 rounded-lg cursor-pointer transition-all duration-150',
        'hover:shadow-md hover:scale-[1.01]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        violation.severity === 'error'
          ? 'bg-red-50 hover:bg-red-100'
          : 'bg-yellow-50 hover:bg-yellow-100',
        'animate-expand'
      )}
      onClick={() => onViolationClick?.(violation)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViolationClick?.(violation);
        }
      }}
      aria-label={`${violation.severity === 'error' ? '오류' : '경고'}: ${violation.constraintName} - ${violation.message}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded',
                violation.severity === 'error'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
              )}
            >
              {violation.severity === 'error' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {violation.severity === 'error' ? '오류' : '경고'}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {violation.constraintName}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{violation.message}</p>
          {violation.context.staffName && (
            <p className="mt-1 text-xs text-gray-500">
              직원: {violation.context.staffName}
            </p>
          )}
        </div>
      </div>
    </li>
  );

  // Total visible violations count
  const visibleCount = hardViolations.length + visibleSoftViolations.length;
  const hiddenCount = softViolations.length - visibleSoftViolations.length;

  // Don't render if no violations at all
  if (violations.length === 0) {
    return null;
  }

  // Show collapsed state when all soft violations are hidden
  if (visibleCount === 0 && hiddenCount > 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>위반 목록</span>
              <span className="text-sm font-normal text-gray-500">
                (숨김 {hiddenCount}건)
              </span>
            </CardTitle>
            {onToggleShowAll && (
              <button
                type="button"
                onClick={onToggleShowAll}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                모두 보기
              </button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Don't render if nothing visible and nothing hidden
  if (visibleCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>위반 목록</span>
            <span className="text-sm font-normal text-gray-500">
              ({visibleCount}건
              {hiddenCount > 0 && (
                <>
                  {' / '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleShowAll?.();
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    숨김 {hiddenCount}건 보기
                  </button>
                </>
              )}
              )
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {onToggleShowAll && softViolations.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowAll();
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  showAllViolations
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {showAllViolations ? '경고 숨기기' : '모두 보기'}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-label={isExpanded ? '위반 목록 접기' : '위반 목록 펼치기'}
              aria-expanded={isExpanded}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg
                className={cn(
                  'w-5 h-5 text-gray-500 transition-transform duration-200',
                  isExpanded ? 'rotate-180' : 'rotate-0'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <CardContent className="space-y-4">
          {/* Hard violations (always visible) */}
          {hardViolations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                필수 제약조건 ({hardViolations.length}건)
              </h3>
              <ul className="space-y-2" role="list" aria-label="필수 제약조건 위반 목록">
                {hardViolations.map((v, i) => renderViolation(v, i))}
              </ul>
            </div>
          )}

          {/* Soft violations (shown only when editing relevant cell) */}
          {visibleSoftViolations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                권장 제약조건 ({visibleSoftViolations.length}건)
              </h3>
              <ul className="space-y-2" role="list" aria-label="권장 제약조건 위반 목록">
                {visibleSoftViolations.map((v, i) => renderViolation(v, hardViolations.length + i))}
              </ul>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
