import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Toaster } from 'sonner';
import type { Schedule, ShiftType } from '@/types';
import { useSchedule } from '@/hooks/useSchedule';
import { ProductHeader } from '@/components/ProductView';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ScheduleWorkspace } from '@/components/ScheduleWorkspace';

function createSample() {
  const staff = Array.from({ length: 8 }, (_, i) => ({ id: `demo-${i + 1}`, name: `샘플 직원 ${i + 1}` }));
  const dates = Array.from({ length: 28 }, (_, i) => format(addDays(parseISO('2026-09-07'), i), 'yyyy-MM-dd'));
  const cycle: ShiftType[] = ['D', 'D', 'E', 'E', 'N', 'N', 'OFF', 'OFF'];
  const schedule: Schedule = { id: 'demo', name: '가상 팀 샘플', startDate: dates[0], assignments: staff.flatMap((person, index) => dates.map((date, day) => ({ staffId: person.id, date, shift: cycle[(day + index) % cycle.length] }))) };
  return { staff, schedule };
}

export function DemoView() {
  const [session, setSession] = useState(0);
  return <DemoSession key={session} onReset={() => setSession(value => value + 1)} />;
}

function DemoSession({ onReset }: { onReset: () => void }) {
  const [sample] = useState(createSample);
  const state = useSchedule({ sample });
  const [conflictMessage, setConflictMessage] = useState('');
  const showConflict = () => {
    const person = state.staff[0];
    if (!person) return;
    // Respect sandbox locks, exclusions and eligibility during the guided action.
    const first = state.schedule.startDate;
    const second = format(addDays(parseISO(first), 1), 'yyyy-MM-dd');
    const assignments = [first, second].map(date => state.schedule.assignments.find(a => a.staffId === person.id && a.date === date));
    if (assignments.some(a => a?.isLocked) || !['D', 'N'].every(shift => (person.eligibleShifts ?? ['D', 'E', 'N']).includes(shift as 'D' | 'N')) || [first, second].some(date => (state.schedule.cellExclusions?.[`${person.id}-${date}`] ?? []).length > 0)) {
      setConflictMessage('첫 직원의 처음 두 칸에서 고정·배제를 해제하고 D·N 근무를 허용하거나, 샘플을 초기화한 뒤 다시 체험하세요.');
      return;
    }
    state.updateAssignment(person.id, first, 'N');
    state.updateAssignment(person.id, second, 'D');
    state.setShowAllViolations(true);
    setConflictMessage(`${person.name}의 ${format(parseISO(first), 'M/d')}을 N, ${format(parseISO(second), 'M/d')}을 D로 바꿨습니다. 아래 검증 결과에서 근무 순서 위반을 확인하세요.`);
  };

  return <div className="min-h-screen bg-gray-50">
    <Toaster position="top-center" richColors />
    <ProductHeader />
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section aria-label="샘플 체험 안내" className="rounded-xl border border-blue-200 bg-white p-4 sm:p-5">
        <h1 className="text-xl font-semibold">샘플 근무표 체험</h1>
        <p className="mt-2 text-gray-700">실제 편집기와 같은 화면에서 직원·근무·조건을 바꿔 보세요. 가상 직원 8명의 28일 예시이며 자동 생성 결과가 아닙니다.</p>
        <p className="mt-2 text-sm text-gray-600">이 체험의 변경은 저장되거나 서버로 전송되지 않습니다. 내 근무표는 그대로 유지됩니다. 로그인·자동 생성·복사·불러오기는 내 근무표 편집기에서 이용하세요.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={showConflict} disabled={state.staff.length === 0}>N→D 위반 예시 만들기</Button>
          <Button variant="outline" onClick={onReset}>샘플 초기화</Button>
          <a className="text-sm text-blue-700 underline" href="/">내 근무표 편집기로 이동</a>
        </div>
        {conflictMessage && <p role="status" className="mt-3 text-sm text-blue-800">{conflictMessage}</p>}
      </section>
      <ScheduleWorkspace state={state} initialTab="schedule" />
    </main>
    <Footer />
  </div>;
}
