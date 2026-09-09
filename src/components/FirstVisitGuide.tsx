import type { RefObject } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FirstVisitGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restoreFocusRef: RefObject<HTMLElement | null>;
}

/** Short first-visit orientation for the schedule editor. */
export function FirstVisitGuide({
  open,
  onOpenChange,
  restoreFocusRef,
}: FirstVisitGuideProps) {
  const handleCloseAutoFocus = (event: Event) => {
    // Auto-opened dialogs have no Radix Trigger to restore focus to.
    event.preventDefault();
    restoreFocusRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onCloseAutoFocus={handleCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>근무표 편집기 사용 안내</DialogTitle>
          <DialogDescription>
            직원과 근무 조건을 입력하면 근무표의 문제를 바로 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3 text-sm leading-relaxed text-gray-700">
          <li>
            <span className="mr-2 font-semibold text-blue-700">1</span>
            직원관리 탭에서 직원 이름을 추가하세요.
          </li>
          <li>
            <span className="mr-2 font-semibold text-blue-700">2</span>
            근무표에서 셀을 탭/클릭하면 가능한 D·E·N·OFF가 차례로 바뀝니다.
          </li>
          <li>
            <span className="mr-2 font-semibold text-blue-700">3</span>
            셀을 0.5초 길게 누르거나 우클릭하면 고정·배제·초기화를 할 수 있습니다. 고정한 근무는 자동 생성에서도 유지됩니다.
          </li>
          <li>
            <span className="mr-2 font-semibold text-blue-700">4</span>
            설정 탭에서 필요한 인원과 휴무 조건을 팀에 맞게 조정하세요.
          </li>
        </ol>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <a href="/demo" onClick={() => onOpenChange(false)}>
              샘플로 둘러보기
            </a>
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            내 근무표 만들기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
