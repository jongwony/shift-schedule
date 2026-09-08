/**
 * Upgrade dialog shown when free generation limit (3/month) is reached.
 * Day Pass single-tier (v1.1) — Lifetime placeholder shown as inactive column.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePrompt({
  open,
  onOpenChange,
}: UpgradePromptProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>무료 생성 횟수 소진</DialogTitle>
          <DialogDescription>
            이번 달 무료 생성 횟수(3회)를 모두 사용했습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left font-medium text-muted-foreground" />
                <th className="py-2 text-center font-medium">Day Pass</th>
                <th className="py-2 text-center font-medium text-gray-400">
                  평생 사용
                  <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-normal">
                    문의
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="border-b border-gray-100">
                <td className="py-2.5 text-left text-muted-foreground">가격</td>
                <td className="py-2.5 font-medium">3,000원/1회</td>
                <td className="py-2.5 text-gray-400">—</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2.5 text-left text-muted-foreground">기간</td>
                <td className="py-2.5">첫 사용 시점부터 24시간</td>
                <td className="py-2.5 text-gray-400">—</td>
              </tr>
              <tr>
                <td className="py-2.5 text-left text-muted-foreground">상태</td>
                <td className="py-2.5 text-xs text-blue-600">준비 중</td>
                <td className="py-2.5 text-xs text-gray-400">준비 중</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-400 rounded-md cursor-not-allowed"
          >
            유료 결제 준비 중
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground text-center">
            현재 결제를 받지 않습니다. 다음 달 무료 생성 횟수가 갱신되며, 수동 편집과 검증은 계속 이용할 수 있습니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
