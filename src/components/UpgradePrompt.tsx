/**
 * Upgrade dialog shown when free generation limit (3/month) is reached.
 * Presents Day Pass vs Annual subscription comparison.
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
  onUpgrade: (type: 'daypass' | 'annual') => void;
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
          {/* Comparison table */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-2 text-left font-medium text-muted-foreground" />
                <th className="py-2 text-center font-medium">Day Pass</th>
                <th className="py-2 text-center font-medium text-blue-600">
                  Annual
                  <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-normal">
                    추천
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="text-center">
              <tr className="border-b border-gray-100">
                <td className="py-2.5 text-left text-muted-foreground">가격</td>
                <td className="py-2.5">3,000원/1회</td>
                <td className="py-2.5 font-medium">3,000원/월</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2.5 text-left text-muted-foreground">기간</td>
                <td className="py-2.5">24시간</td>
                <td className="py-2.5">무제한</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2.5 text-left text-muted-foreground">자동 갱신</td>
                <td className="py-2.5">X</td>
                <td className="py-2.5">O</td>
              </tr>
              <tr>
                <td className="py-2.5 text-left text-muted-foreground">추천</td>
                <td className="py-2.5 text-xs text-muted-foreground">일회성 사용</td>
                <td className="py-2.5 text-xs text-blue-600">매달 사용</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={() => onUpgrade('daypass')}
            className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            데이 패스 구매
          </button>
          <button
            type="button"
            onClick={() => onUpgrade('annual')}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            연간 구독 (추천)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
