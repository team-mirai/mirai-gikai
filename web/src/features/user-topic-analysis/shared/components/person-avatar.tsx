import { cn } from "@/lib/utils";

type BillSentiment = "期待" | "懸念" | null;
type SentimentKey = NonNullable<BillSentiment> | "none";

/** stance(期待/懸念) に応じた背景円の色。 */
const bgClass: Record<SentimentKey, string> = {
  期待: "bg-stance-for-bg",
  懸念: "bg-stance-against-bg",
  none: "bg-mirai-surface-warm",
};

/** stance に応じたシルエット色（currentColor で塗る）。 */
const fgClass: Record<SentimentKey, string> = {
  期待: "text-primary-accent",
  懸念: "text-stance-against-light",
  none: "text-mirai-text-muted",
};

interface PersonAvatarProps {
  sentiment: BillSentiment;
  className?: string;
}

/**
 * 回答者アバター（Figma の人物シルエット）。
 * lucide に同等のアイコンが無いため、デザインの「頭＋肩の2円を円でクリップ」した
 * シルエットをカスタムコンポーネントとして実装する（lucide 必須ルールの合意済み例外）。
 * 背景円・シルエット色は stance（期待/懸念）に追従する。
 */
export function PersonAvatar({ sentiment, className }: PersonAvatarProps) {
  const key: SentimentKey = sentiment ?? "none";
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full",
        bgClass[key],
        className
      )}
    >
      <svg
        viewBox="0 0 46 46"
        className={cn("size-full", fgClass[key])}
        fill="currentColor"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 頭 */}
        <circle cx="23" cy="15.79" r="8.12" opacity="0.6" />
        {/* 肩（下部は円マスク＝overflow-hidden で切れる） */}
        <circle cx="23" cy="37.94" r="14.03" opacity="0.4" />
      </svg>
    </span>
  );
}
