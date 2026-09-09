/** Shared instructions stay beside the same grid in the editor and sample. */
export function ScheduleInteractionHelp() {
  return (
    <aside aria-label="근무표 조작 안내" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-950">
      <p><strong>한 번 누르면 근무 변경</strong> · 가능한 D → E → N → OFF 순서로 바뀝니다.</p>
      <p><strong>꾹 누르면 더 보기</strong> · 휴대폰에서 0.5초 길게 누르거나, 마우스 오른쪽 버튼으로 고정·배제·초기화 메뉴를 여세요.</p>
      <p className="mt-1 text-blue-800">고정한 근무는 자동 생성 시 유지됩니다. 고정 해제도 같은 메뉴에서 할 수 있습니다.</p>
    </aside>
  );
}
