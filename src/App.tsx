import { Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StaffList } from '@/components/StaffList';
import { ScheduleGrid } from '@/components/ScheduleGrid';
import { ConfigPanel } from '@/components/ConfigPanel';
import { FeasibilityResult } from '@/components/FeasibilityResult';
import { ViolationList } from '@/components/ViolationList';
import { PeriodSelector } from '@/components/PeriodSelector';
import { PreviousPeriodInput } from '@/components/PreviousPeriodInput';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSchedule } from '@/hooks/useSchedule';
import { isApiConfigured } from '@/services/solverApi';

function App() {
  const {
    staff,
    schedule,
    config,
    previousPeriodEnd,
    feasibilityResult,
    scheduleCompleteness,
    generationStatus,
    preCheckResult,
    editingCell,
    affectedCells,
    showAllViolations,
    addStaff,
    removeStaff,
    updateStaff,
    updateAssignment,
    toggleLock,
    setStartDate,
    setPreviousPeriodEnd,
    generateAutoSchedule,
    setEditingCell,
    setShowAllViolations,
    setHoveredCell,
    setConfig,
    exportToJSON,
    importFromJSON,
  } = useSchedule();

  // Export handler
  const handleExport = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shift-schedule-${schedule.startDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import handler
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            importFromJSON(content);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="bottom-right" duration={2000} />

        {/* Skip link for keyboard navigation */}
        <a
          href="#main-content"
          className="skip-link"
        >
          본문으로 건너뛰기
        </a>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Shift Schedule - 교대 근무 검증하기
            </h1>
            <nav aria-label="주요 기능">
              <div className="flex gap-2">
                {isApiConfigured() && (
                  <button
                    onClick={generateAutoSchedule}
                    disabled={generationStatus === 'loading' || staff.length === 0}
                    aria-label="근무표 자동 생성"
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="hidden sm:inline">{generationStatus === 'loading' ? '생성 중...' : '자동 생성'}</span>
                    </span>
                  </button>
                )}
                <button
                  onClick={handleExport}
                  aria-label="근무표를 JSON 파일로 내보내기"
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="hidden sm:inline">내보내기</span>
                  </span>
                </button>
                <button
                  onClick={handleImport}
                  aria-label="JSON 파일에서 근무표 불러오기"
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">불러오기</span>
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 py-6" tabIndex={-1}>
          <ErrorBoundary>
            <Tabs defaultValue="staff" className="space-y-4">
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
                    onUpdateStaff={updateStaff}
                  />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <ErrorBoundary>
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                      <PeriodSelector
                        startDate={schedule.startDate}
                        onStartDateChange={setStartDate}
                      />
                    </div>
                    <div className="pt-8">
                      <PreviousPeriodInput
                        staff={staff}
                        previousPeriodEnd={previousPeriodEnd}
                        onPreviousPeriodChange={setPreviousPeriodEnd}
                        startDate={schedule.startDate}
                      />
                    </div>
                  </div>
                  <ScheduleGrid
                    schedule={schedule}
                    staff={staff}
                    violations={feasibilityResult?.violations ?? []}
                    affectedCells={affectedCells}
                    onAssignmentChange={updateAssignment}
                    onToggleLock={toggleLock}
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
              <FeasibilityResult result={feasibilityResult} completeness={scheduleCompleteness} preCheckResult={preCheckResult} />
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
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
