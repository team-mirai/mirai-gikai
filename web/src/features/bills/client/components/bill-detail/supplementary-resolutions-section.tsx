import { ExternalLink } from "lucide-react";
import {
  HOUSE_LABELS,
  type PublishedSupplementaryResolution,
  STANCE_LABELS,
} from "../../../shared/types";
import { SupplementaryResolutionInfo } from "./supplementary-resolution-info";

interface SupplementaryResolutionsSectionProps {
  resolutions: PublishedSupplementaryResolution[];
}

const STANCE_BG: Record<PublishedSupplementaryResolution["stance"], string> = {
  for: "bg-mirai-gradient",
  against: "bg-mirai-surface-muted",
};

/**
 * 議案に付された附帯決議と、それに対するチームみらいの賛否。
 * 「チームみらいの賛否」の次に独立したセクションとして置き、院ごとにカードを並べる。
 * 必須は賛否だけで、ほかの項目は入力があるときだけ出す。
 * 公開済みのものだけを受け取る（非公開は担当議員室の公開確認を待っている）
 */
export function SupplementaryResolutionsSection({
  resolutions,
}: SupplementaryResolutionsSectionProps) {
  // 1院だけなら院名は出さない（デザイン準拠）。両院ある場合だけ区別のために出す
  const showHouse = resolutions.length > 1;

  return (
    <section>
      <div className="mb-4 flex items-center gap-1">
        <h2 className="text-[22px] font-bold">📜附帯決議への賛否</h2>
        <SupplementaryResolutionInfo />
      </div>
      <div className="flex flex-col gap-6">
        {resolutions.map((resolution) => (
          <ResolutionCard
            key={resolution.house}
            resolution={resolution}
            showHouse={showHouse}
          />
        ))}
      </div>
    </section>
  );
}

function ResolutionCard({
  resolution,
  showHouse,
}: {
  resolution: PublishedSupplementaryResolution;
  showHouse: boolean;
}) {
  const houseLabel = HOUSE_LABELS[resolution.house];

  return (
    <div className="rounded-2xl bg-mirai-gradient p-1">
      <div className="flex flex-col gap-6 rounded-lg bg-white px-6 py-8">
        <div className="flex flex-col gap-2">
          {showHouse && (
            <h3 className="text-sm font-bold text-mirai-text-note">
              {houseLabel}の附帯決議
            </h3>
          )}
          <div
            className={`flex justify-center rounded-lg py-4 ${STANCE_BG[resolution.stance]}`}
          >
            <span className="text-xl font-bold text-black">
              {STANCE_LABELS[resolution.stance]}
            </span>
          </div>
        </div>

        {resolution.content && (
          <ResolutionNote
            title="附帯決議の内容"
            body={resolution.content}
            bodyClassName="rounded-lg bg-background px-4 py-3.5 text-sm leading-[1.8] text-mirai-text-secondary"
          />
        )}
        {resolution.reason && (
          <ResolutionNote title="理由" body={resolution.reason} />
        )}
        {resolution.focus_points && (
          <ResolutionNote title="重視した事項" body={resolution.focus_points} />
        )}
        {resolution.reference_url && (
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-bold text-mirai-text-note">
              参考リンク
            </h3>
            <a
              href={resolution.reference_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium leading-[1.6] text-mirai-text underline underline-offset-[3px]"
            >
              {houseLabel}の附帯決議
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ResolutionNote({
  title,
  body,
  bodyClassName = "text-base font-medium leading-[1.875]",
}: {
  title: string;
  body: string;
  bodyClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className={`whitespace-pre-wrap ${bodyClassName}`}>{body}</p>
    </div>
  );
}
