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
  onUpgrade: (type: 'daypass') => void;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  onUpgrade,
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
                <td className="py-2.5 text-xs text-blue-600">바로 구매</td>
                <td className="py-2.5 text-xs text-gray-400">준비 중</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onUpgrade('daypass')}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            데이 패스 구매
          </button>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground text-center">
            결제 후 첫 생성 시점부터 24시간 카운트가 시작됩니다. 사용 시작 후에는 환불이 불가능합니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
