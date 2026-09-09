import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffList } from '@/components/StaffList';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { ConfigPanel } from '@/components/ConfigPanel';
import { FeasibilityResult } from '@/components/FeasibilityResult';
import { ViolationList } from '@/components/ViolationList';
import { PeriodSelector } from '@/components/PeriodSelector';
import { PreviousPeriodInput } from '@/components/PreviousPeriodInput';
import { RequiredNightsInput } from '@/components/RequiredNightsInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { useSchedule } from '@/hooks/useSchedule';
import { ScheduleInteractionHelp } from './ScheduleInteractionHelp';

export function ScheduleWorkspace({ state, initialTab = 'staff' }: { state: ReturnType<typeof useSchedule>; initialTab?: 'staff' | 'schedule' }) {
  const {
    staff,
    schedule,
    config,
    previousPeriodEnd,
    requiredNights,
    feasibilityResult,
    scheduleCompleteness,
    preCheckResult,
    generateDiagnosis,
    editingCell,
    affectedCells,
    showAllViolations,
    addStaff,
    removeStaff,
    updateStaff,
    updateAssignment,
    toggleLock,
    toggleExclusion,
    resetCell,
    setStartDate,
    setPreviousPeriodEnd,
    setRequiredNights,
    setEditingCell,
    setShowAllViolations,
    setHoveredCell,
    setConfig,
  } = state;
  return <>
    <ErrorBoundary>
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList aria-label="근무표 관리 탭">
          <TabsTrigger value="staff">직원관리</TabsTrigger>
          <TabsTrigger value="schedule">근무표</TabsTrigger>
          <TabsTrigger value="config">설정</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="space-y-4">
          <ErrorBoundary>
            <StaffList
              staff={staff}
              onAddStaff={addStaff}
              onRemoveStaff={removeStaff}
            />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          <ErrorBoundary>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0 basis-72">
                <PeriodSelector
                  startDate={schedule.startDate}
                  onStartDateChange={setStartDate}
                />
              </div>
              <div className="pt-8 flex gap-2">
                <RequiredNightsInput
                  staff={staff}
                  startDate={schedule.startDate}
                  requiredNights={requiredNights}
                  onRequiredNightsChange={setRequiredNights}
                />
                <PreviousPeriodInput
                  staff={staff}
                  previousPeriodEnd={previousPeriodEnd}
                  onPreviousPeriodChange={setPreviousPeriodEnd}
                  startDate={schedule.startDate}
                />
              </div>
            </div>
            <ScheduleInteractionHelp />
            <ScheduleGrid
              schedule={schedule}
              staff={staff}
              violations={feasibilityResult?.violations ?? []}
              affectedCells={affectedCells}
              requiredNights={requiredNights}
              onAssignmentChange={updateAssignment}
              onToggleLock={toggleLock}
              onToggleExclusion={toggleExclusion}
              onResetCell={resetCell}
              onUpdateStaff={updateStaff}
              onEditingCellChange={setEditingCell}
              onHoverCellChange={setHoveredCell}
            />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="config" className="space-y-4">
          <ErrorBoundary>
            <ConfigPanel config={config} onConfigChange={setConfig} />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </ErrorBoundary>
    {/* Feasibility result - always visible */}
    <section aria-label="타당성 검사 결과" className="mt-6 space-y-4">
      <ErrorBoundary>
        <FeasibilityResult result={feasibilityResult} completeness={scheduleCompleteness} preCheckResult={preCheckResult} generateDiagnosis={generateDiagnosis} />
        {feasibilityResult && feasibilityResult.violations.length > 0 && (
          <ViolationList
            violations={feasibilityResult.violations}
            editingCell={editingCell}
            showAllViolations={showAllViolations}
            onToggleShowAll={() => setShowAllViolations((prev) => !prev)}
          />
        )}
      </ErrorBoundary>
    </section>
  </>;
}
