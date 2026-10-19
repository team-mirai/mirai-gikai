import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

/** AI記事であることの告知と、誤り報告フォームを開く導線 */
export function ArticleReportLead({ onOpen }: { onOpen?: () => void }) {
  return (
    <div className="flex gap-1.5 items-start">
      <Info className="size-[15px] shrink-0 mt-[3px] text-mirai-text-slate" />
      <p className="text-[13px] font-medium leading-[1.6] text-mirai-text-slate">
        この記事はAIが作成しています。誤りやお気づきの点がありましたら、
        {onOpen ? (
          <>
            <Button
              variant="link"
              onClick={onOpen}
              className="inline text-[13px] font-medium leading-[1.6] text-mirai-text-slate underline-offset-[3px] hover:opacity-70"
            >
              こちらから
            </Button>
            お知らせください。
          </>
        ) : (
          "お知らせください。"
        )}
      </p>
    </div>
  );
}
