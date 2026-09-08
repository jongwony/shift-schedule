import { useMemo, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import type { Schedule, ShiftType } from '@/types';
import { checkFeasibility, getDefaultConfig } from '@/solver/feasibilityChecker';
import { ProductHeader } from '@/components/ProductView';
import { Footer } from '@/components/Footer';
import { ViolationList } from '@/components/ViolationList';
import { Button } from '@/components/ui/button';

const staff = Array.from({ length: 8 }, (_, i) => ({ id: `demo-${i + 1}`, name: `샘플 직원 ${i + 1}` }));
const dates = Array.from({ length: 28 }, (_, i) => format(addDays(parseISO('2026-09-07'), i), 'yyyy-MM-dd'));
const shifts: ShiftType[] = ['D', 'E', 'N', 'OFF'];
const colors: Record<ShiftType, string> = { D: 'bg-blue-50 text-blue-900', E: 'bg-orange-50 text-orange-900', N: 'bg-indigo-50 text-indigo-900', OFF: 'bg-gray-100 text-gray-700' };

function createSample(): Schedule {
  const cycle: ShiftType[] = ['D', 'D', 'E', 'E', 'N', 'N', 'OFF', 'OFF'];
  return { id: 'demo', name: '가상 팀 샘플', startDate: dates[0], assignments: staff.flatMap((person, index) => dates.map((date, day) => ({ staffId: person.id, date, shift: cycle[(day + index) % cycle.length] }))) };
}

export function DemoView() {
  const [schedule, setSchedule] = useState(createSample);
  const config = useMemo(() => getDefaultConfig(), []);
  const result = useMemo(() => checkFeasibility(schedule, staff, config), [schedule, config]);
  const errors = result.violations.filter(v => v.severity === 'error').length;
  const warnings = result.violations.length - errors;
  const setShift = (staffId: string, date: string, shift: ShiftType) => setSchedule(current => ({ ...current, assignments: current.assignments.map(a => a.staffId === staffId && a.date === date ? { ...a, shift } : a) }));
  const showConflict = () => setSchedule(current => ({ ...current, assignments: current.assignments.map(a => a.staffId === staff[0].id && a.date === dates[0] ? { ...a, shift: 'N' } : a.staffId === staff[0].id && a.date === dates[1] ? { ...a, shift: 'D' } : a) }));

  return <div className="min-h-screen bg-gray-50"><ProductHeader /><main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
    <div><h1 className="text-2xl font-semibold">샘플 근무표 검증 체험</h1><p className="mt-3 leading-relaxed text-gray-600">가상 직원 8명 · 28일. 각 칸에서 근무를 변경하면 실제 검증 결과가 갱신됩니다. 이 샘플은 자동 생성 결과가 아니며, 기본 설정에서 위반이 있는 교육용 예시입니다.</p><p className="mt-2 text-sm text-gray-600">변경은 저장되거나 서버로 전송되지 않습니다. 새로고침하면 초기화되고 내 근무표는 유지됩니다.</p></div>
    <div className="flex flex-wrap items-center gap-3"><Button onClick={showConflict}>N→D 위반 예시 만들기</Button><Button variant="outline" onClick={() => setSchedule(createSample())}>샘플 초기화</Button><a className="text-sm text-blue-700 underline" href="/">내 근무표 편집기로 이동</a></div>
    <p className="text-sm text-gray-600">위반 예시 버튼은 직원 1의 9/7을 N, 9/8을 D로 바꿉니다. D 주간 · E 저녁 · N 야간 · OFF 휴무</p>
    <div role="status" aria-live="polite" className="rounded-lg border bg-white p-4 text-lg">필수 조건 위반 <strong className="text-red-700">{errors}건</strong> · 선호 조건 경고 <strong className="text-amber-700">{warnings}건</strong></div>
    <div className="overflow-x-auto rounded-lg border bg-white" tabIndex={0} role="region" aria-label="28일 샘플 근무표, 가로 스크롤 가능">
      <table className="w-full border-collapse text-sm"><caption className="p-3 text-left text-gray-600">9월 7일–10월 4일 · 가로로 스크롤해 전체 기간을 확인하세요</caption><thead><tr><th scope="col" className="min-w-28 p-3 text-left">직원</th>{dates.map(date => <th key={date} scope="col" className="p-2 font-medium">{format(parseISO(date), 'M/d')}</th>)}</tr></thead><tbody>{staff.map(person => <tr key={person.id} className="border-t"><th scope="row" className="whitespace-nowrap p-3 text-left font-medium">{person.name}</th>{dates.map(date => {
        const value = schedule.assignments.find(a => a.staffId === person.id && a.date === date)!.shift;
        return <td key={date} className="p-1"><select aria-label={`${person.name} ${date} 근무`} value={value} onChange={e => setShift(person.id, date, e.target.value as ShiftType)} className={`min-w-16 rounded p-2 ${colors[value]}`}>{shifts.map(shift => <option key={shift} value={shift}>{shift}</option>)}</select></td>;
      })}</tr>)}</tbody></table>
    </div>
    <section aria-label="샘플 검증 결과"><ViolationList violations={result.violations} showAllViolations /></section>
  </main><Footer /></div>;
}
