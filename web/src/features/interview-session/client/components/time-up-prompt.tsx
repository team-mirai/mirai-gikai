"use client";

import { Button } from "@/components/ui/button";

interface TimeUpPromptProps {
  onEndInterview: () => void;
  onContinue: () => void;
  disabled?: boolean;
}

/**
 * 目安時間超過時にユーザーに終了/継続を尋ねるコンポーネント
 */
export function TimeUpPrompt({
  onEndInterview,
  onContinue,
  disabled,
}: TimeUpPromptProps) {
  return (
    <div className="mx-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <p className="mb-3 text-sm font-medium text-orange-800">
        目安時間が終了しました。レポート作成に進みますか？
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onEndInterview}
          disabled={disabled}
          className="bg-[#0F8472] hover:bg-[#0d7364]"
        >
          レポート作成に進む
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onContinue}
          disabled={disabled}
        >
          インタビューを続ける
        </Button>
      </div>
    </div>
  );
}
