import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type {
  Staff,
  Schedule,
  ShiftAssignment,
  ShiftType,
  ConstraintConfig,
  FeasibilityResult,
  GenerationStatus,
  FeasibilityCheckResponse,
} from '@/types';
import { checkFeasibility, getDefaultConfig } from '@/solver/feasibilityChecker';
import { calculateScheduleCompleteness } from '@/utils/shiftUtils';
import {
  calculateCellImpact,
  buildImpactMap,
  type ImpactReason,
} from '@/utils/impactCalculator';
import { useLocalStorage } from './useLocalStorage';
import { generateSchedule, checkFeasibilityApi, isApiConfigured } from '@/services/solverApi';

// Storage keys
const STORAGE_KEYS = {
  staff: 'shift-schedule-staff',
  schedule: 'shift-schedule-current',
  config: 'shift-schedule-config',
  previousPeriod: 'shift-schedule-previous',
  schemaVersion: 'shift-schedule-version',
} as const;

// Schema version: increment when localStorage structure changes
const CURRENT_SCHEMA_VERSION = 2;

/**
 * Check and migrate localStorage schema.
 * Version 2: juhuDay removed from Staff (solver auto-determines).
 * Returns true if migration occurred (data was reset).
 */
function migrateStorageIfNeeded(): boolean {
  if (typeof window === 'undefined') return false;

  const storedVersion = localStorage.getItem(STORAGE_KEYS.schemaVersion);
  const version = storedVersion ? parseInt(storedVersion, 10) : 1;

  if (version < CURRENT_SCHEMA_VERSION) {
    // Clear staff and schedule data
    localStorage.removeItem(STORAGE_KEYS.staff);
    localStorage.removeItem(STORAGE_KEYS.schedule);
    localStorage.removeItem(STORAGE_KEYS.previousPeriod);

    // Clean up juhu-related fields from config (v1 → v2 migration)
    const storedConfig = localStorage.getItem(STORAGE_KEYS.config);
    if (storedConfig) {
      try {
        const config = JSON.parse(storedConfig);
        if (config.constraintSeverity) {
          delete config.constraintSeverity.juhu;
        }
        if (config.enabledConstraints) {
          delete config.enabledConstraints.juhu;
        }
        localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config));
      } catch {
        // If parsing fails, remove config entirely
        localStorage.removeItem(STORAGE_KEYS.config);
      }
    }

    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
    return true;
  }

  // Ensure version is set for new users
  if (!storedVersion) {
    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
  }

  return false;
}

// Run migration immediately on module load (before useLocalStorage hooks)
migrateStorageIfNeeded();

/**
 * Generate a unique ID for entities.
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Get default schedule with today's date as start.
 */
function getDefaultSchedule(): Schedule {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return {
    id: generateId(),
    name: '근무표',
    startDate: `${year}-${month}-${day}`,
    assignments: [],
  };
}

/**
 * Export data structure for JSON export/import.
 */
interface ExportData {
  version: string;
  exportedAt: string;
  staff: Staff[];
  schedule: Schedule;
  config: ConstraintConfig;
  previousPeriodEnd: ShiftAssignment[];
}

/**
 * Main state management hook for the schedule application.
 *
 * Features:
 * - Persisted state via localStorage
 * - Derived feasibility result (memoized)
 * - CRUD actions for staff and schedule
 * - Export/import functionality
 * - Session recovery notification
 */
export function useSchedule() {
  // Persisted state
  const [staff, setStaff] = useLocalStorage<Staff[]>(STORAGE_KEYS.staff, []);
  const [schedule, setSchedule] = useLocalStorage<Schedule>(
    STORAGE_KEYS.schedule,
    getDefaultSchedule()
  );
  const [config, setConfig] = useLocalStorage<ConstraintConfig>(
    STORAGE_KEYS.config,
    getDefaultConfig()
  );
  const [previousPeriodEnd, setPreviousPeriodEnd] = useLocalStorage<ShiftAssignment[]>(
    STORAGE_KEYS.previousPeriod,
    []
  );

  // Generation status for auto-schedule API
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');

  // Pre-check result for displaying analysis
  const [preCheckResult, setPreCheckResult] = useState<FeasibilityCheckResponse | null>(null);

  // Show all soft violations (triggered by auto-generation or user toggle)
  const [showAllViolations, setShowAllViolations] = useState(false);

  // Currently editing cell (for soft violation filtering)
  const [editingCell, setEditingCell] = useState<{ staffId: string; date: string } | null>(null);

  // Hovered cell for cascading effect visualization
  const [hoveredCell, setHoveredCell] = useState<{ staffId: string; date: string } | null>(null);

  // Track if session recovery toast has been shown
  const hasShownRecoveryToast = useRef(false);

  // Session recovery notification on mount
  useEffect(() => {
    if (hasShownRecoveryToast.current) {
      return;
    }

    // Check if there's meaningful saved data
    const hasData =
      staff.length > 0 || schedule.assignments.length > 0 || previousPeriodEnd.length > 0;

    if (hasData) {
      hasShownRecoveryToast.current = true;
      toast.info('이전 세션이 복구되었습니다.');
    }
  }, [staff.length, schedule.assignments.length, previousPeriodEnd.length]);

  // Warn before leaving with unsaved changes (beforeunload)
  useEffect(() => {
    const hasData =
      staff.length > 0 || schedule.assignments.length > 0;

    if (!hasData) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Data is already auto-saved via useLocalStorage,
      // but we still warn in case user wants to confirm
      e.preventDefault();
      // Modern browsers ignore custom messages, but this triggers the dialog
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [staff.length, schedule.assignments.length]);

  // Derived state: schedule completeness (memoized)
  const scheduleCompleteness = useMemo(() => {
    return calculateScheduleCompleteness(schedule.assignments, staff.length, 28);
  }, [schedule.assignments, staff.length]);

  // Derived state: feasibility result (memoized)
  const feasibilityResult = useMemo<FeasibilityResult | null>(() => {
    if (!schedule.startDate || staff.length === 0) {
      return null;
    }
    return checkFeasibility(schedule, staff, config, previousPeriodEnd);
  }, [schedule, staff, config, previousPeriodEnd]);

  // Derived state: affected cells when hovering (memoized)
  const affectedCells = useMemo<Map<string, ImpactReason>>(() => {
    if (!hoveredCell || staff.length === 0) {
      return new Map();
    }
    const impacts = calculateCellImpact(schedule, staff, hoveredCell);
    return buildImpactMap(impacts);
  }, [hoveredCell, schedule, staff]);

  // ==================== Staff Actions ====================

  const addStaff = useCallback((name: string) => {
    const newStaff: Staff = {
      id: generateId(),
      name,
    };
    setStaff((prev) => [...prev, newStaff]);
    toast.success(`${name} 직원이 추가되었습니다.`);
  }, [setStaff]);

  const removeStaff = useCallback((staffId: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== staffId));
    // Also remove assignments for this staff
    setSchedule((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.staffId !== staffId),
    }));
    setPreviousPeriodEnd((prev) => prev.filter((a) => a.staffId !== staffId));
  }, [setStaff, setSchedule, setPreviousPeriodEnd]);

  const updateStaff = useCallback(
    (staffId: string, updates: Partial<Pick<Staff, 'name'>>) => {
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, ...updates } : s))
      );
    },
    [setStaff]
  );

  // ==================== Schedule Actions ====================

  const updateAssignment = useCallback(
    (staffId: string, date: string, shift: ShiftType) => {
      setSchedule((prev) => {
        const existingIndex = prev.assignments.findIndex(
          (a) => a.staffId === staffId && a.date === date
        );

        let newAssignments: ShiftAssignment[];
        if (existingIndex >= 0) {
          // Preserve isLocked when changing shift
          const existing = prev.assignments[existingIndex];
          newAssignments = [...prev.assignments];
          newAssignments[existingIndex] = { staffId, date, shift, isLocked: existing.isLocked };
        } else {
          newAssignments = [...prev.assignments, { staffId, date, shift }];
        }

        return { ...prev, assignments: newAssignments };
      });
    },
    [setSchedule]
  );

  const toggleLock = useCallback(
    (staffId: string, date: string) => {
      setSchedule((prev) => {
        const existingIndex = prev.assignments.findIndex(
          (a) => a.staffId === staffId && a.date === date
        );

        if (existingIndex >= 0) {
          // Toggle lock on existing assignment
          const newAssignments = [...prev.assignments];
          newAssignments[existingIndex] = {
            ...newAssignments[existingIndex],
            isLocked: !newAssignments[existingIndex].isLocked,
          };
          return { ...prev, assignments: newAssignments };
        } else {
          // Empty cell: create OFF assignment with lock
          return {
            ...prev,
            assignments: [
              ...prev.assignments,
              { staffId, date, shift: 'OFF' as ShiftType, isLocked: true },
            ],
          };
        }
      });
    },
    [setSchedule]
  );

  const setStartDate = useCallback((date: string) => {
    setSchedule((prev) => ({
      ...prev,
      startDate: date,
      // Clear assignments when period changes
      assignments: [],
    }));
    setPreviousPeriodEnd([]);
  }, [setSchedule, setPreviousPeriodEnd]);

  const clearSchedule = useCallback(() => {
    setSchedule((prev) => ({
      ...prev,
      assignments: [],
    }));
    toast.success('근무표가 초기화되었습니다.');
  }, [setSchedule]);

  // ==================== Auto-Generation Actions ====================

  const generateAutoSchedule = useCallback(async () => {
    if (!isApiConfigured()) {
      toast.error('API가 설정되지 않았습니다.');
      return;
    }

    if (staff.length === 0) {
      toast.error('직원을 먼저 추가해 주세요.');
      return;
    }

    setGenerationStatus('loading');

    // Extract locked assignments
    const lockedAssignments = schedule.assignments.filter((a) => a.isLocked);

    const requestPayload = {
      staff: staff.map((s) => ({ id: s.id, name: s.name })),
      startDate: schedule.startDate,
      constraints: {
        maxConsecutiveNights: config.maxConsecutiveNights,
        monthlyNightsRequired: config.monthlyNightsRequired,
        weeklyWorkHours: config.weeklyWorkHours,
        weekdayStaffing: config.weekdayStaffing,
        weekendStaffing: config.weekendStaffing,
        constraintSeverity: config.constraintSeverity,
        softConstraints: config.softConstraints,
      },
    };

    try {
      // Pre-check feasibility before generation
      const checkResult = await checkFeasibilityApi(requestPayload);
      setPreCheckResult(checkResult);

      if (!checkResult.feasible) {
        setGenerationStatus('error');
        // Show each reason as a separate toast or combine them
        const reasonsText = checkResult.reasons.join('\n');
        toast.error(`생성 불가능:\n${reasonsText}`, {
          duration: 8000, // Longer duration for multiple reasons
          style: { whiteSpace: 'pre-line' },
        });
        return;
      }

      // Proceed with actual generation
      const response = await generateSchedule({
        ...requestPayload,
        previousPeriodEnd: previousPeriodEnd.length > 0 ? previousPeriodEnd : undefined,
        lockedAssignments: lockedAssignments.length > 0 ? lockedAssignments : undefined,
      });

      if (response.success && response.schedule) {
        // Merge: keep locked assignments, add non-conflicting generated assignments
        const mergedAssignments = [
          ...lockedAssignments, // Keep locked assignments (with isLocked flag)
          ...response.schedule!.assignments.filter(
            (generated) =>
              !lockedAssignments.some(
                (locked) => locked.staffId === generated.staffId && locked.date === generated.date
              )
          ),
        ];

        setSchedule((prev) => ({
          ...prev,
          assignments: mergedAssignments,
          staffJuhuDays: response.staffJuhuDays, // Solver가 결정한 주휴일 저장
        }));
        setGenerationStatus('success');
        setShowAllViolations(true);
        setPreCheckResult(null); // Clear pre-check result on success
        const lockedCount = lockedAssignments.length;
        const message = lockedCount > 0
          ? `근무표가 자동 생성되었습니다. (고정: ${lockedCount}개)`
          : '근무표가 자동 생성되었습니다.';
        toast.success(message);
      } else {
        setGenerationStatus('error');
        const errorMessage = response.error?.message ?? '알 수 없는 오류가 발생했습니다.';
        toast.error(`생성 실패: ${errorMessage}`);
      }
    } catch (error) {
      setGenerationStatus('error');
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(`API 오류: ${message}`);
    }
  }, [staff, schedule.startDate, schedule.assignments, config, previousPeriodEnd, setSchedule]);

  // ==================== Export/Import Actions ====================

  const exportToJSON = useCallback((): string => {
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      staff,
      schedule,
      config,
      previousPeriodEnd,
    };
    return JSON.stringify(exportData, null, 2);
  }, [staff, schedule, config, previousPeriodEnd]);

  const importFromJSON = useCallback((json: string): boolean => {
    try {
      const data = JSON.parse(json) as ExportData;

      // Basic validation
      if (!data.version || !data.staff || !data.schedule || !data.config) {
        throw new Error('Invalid export file format');
      }

      // Import all data
      setStaff(data.staff);
      setSchedule(data.schedule);
      setConfig(data.config);
      setPreviousPeriodEnd(data.previousPeriodEnd ?? []);

      toast.success('데이터를 성공적으로 불러왔습니다.');
      return true;
    } catch (error) {
      console.error('Import error:', error);
      toast.error('데이터 불러오기에 실패했습니다. 파일 형식을 확인해 주세요.');
      return false;
    }
  }, [setStaff, setSchedule, setConfig, setPreviousPeriodEnd]);

  return {
    // State
    staff,
    schedule,
    config,
    previousPeriodEnd,
    feasibilityResult,
    scheduleCompleteness,
    generationStatus,
    preCheckResult,
    editingCell,
    hoveredCell,
    affectedCells,
    showAllViolations,

    // Staff actions
    addStaff,
    removeStaff,
    updateStaff,

    // Schedule actions
    updateAssignment,
    toggleLock,
    setStartDate,
    clearSchedule,
    setPreviousPeriodEnd,

    // Auto-generation
    generateAutoSchedule,

    // Editing state
    setEditingCell,
    setShowAllViolations,

    // Hover state
    setHoveredCell,

    // Config actions
    setConfig,

    // Export/Import
    exportToJSON,
    importFromJSON,
  };
}
