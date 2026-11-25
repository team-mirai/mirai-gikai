import {
  HOUSE_LABELS,
  type PublishedSupplementaryResolution,
} from "../../../shared/types";

interface SupplementaryResolutionsSectionProps {
  resolutions: PublishedSupplementaryResolution[];
}

const STANCE_LABELS: Record<
  PublishedSupplementaryResolution["stance"],
  string
> = {
  for: "賛成",
  against: "反対",
};

/**
 * 議案に付された附帯決議と、それに対するチームみらいの賛否。院ごとに並べる。
 * チームみらいの賛否カードの中に置くため、カード内の小見出しとして描画する。
 * 公開済みのものだけを受け取る（非公開は担当議員室の公開確認を待っている）
 */
export function SupplementaryResolutionsSection({
  resolutions,
}: SupplementaryResolutionsSectionProps) {
  return (
    <div className="flex flex-col gap-8">
      {resolutions.map((resolution) => (
        <section key={resolution.house} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">
              📜 {HOUSE_LABELS[resolution.house]}の附帯決議
            </h3>
            <span className="rounded-full bg-mirai-surface-grouped px-3 py-1 text-sm font-bold">
              {STANCE_LABELS[resolution.stance]}
            </span>
          </div>

          {resolution.content && (
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {resolution.content}
            </p>
          )}
          {resolution.focus_points && (
            <ResolutionNote
              title="重視した事項"
              body={resolution.focus_points}
            />
          )}
          {resolution.reason && (
            <ResolutionNote title="理由" body={resolution.reason} />
          )}
          {resolution.reference_url && (
            <a
              href={resolution.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              附帯決議の全文を見る
            </a>
          )}
        </section>
      ))}
    </div>
  );
}

function ResolutionNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-bold">{title}</h4>
      <p className="text-base leading-relaxed whitespace-pre-wrap">{body}</p>
    </div>
  );
}
