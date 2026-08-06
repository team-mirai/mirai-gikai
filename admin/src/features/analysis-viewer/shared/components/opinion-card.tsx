import { REASONING_TYPE_LABELS } from "@mirai-gikai/shared/interview-report/opinion-tags";
import { roleLabels } from "@/features/interview-reports/shared/constants";
import type { ViewerOpinion } from "../types";

/**
 * 立場の表示。レポート画面と同じ日本語ラベルに寄せる。
 * roleTitle だけだと「一般市民」のような無情報な文字列が並ぶので、
 * role の区分と組み合わせて引用の妥当性を判断できるようにする。
 */
function formatRole(
  role: string | null,
  roleTitle: string | null
): string | null {
  const label =
    role && role in roleLabels
      ? roleLabels[role as keyof typeof roleLabels]
      : undefined;
  if (label && roleTitle) return `${roleTitle}（${label}）`;
  return roleTitle ?? label ?? null;
}

/**
 * 意見1件のカード。
 *
 * 質疑で引用に使う導線なので、引用文と立場・根拠を前に出す。
 * トピック名は一覧表示のときだけ出す（ツリー内では文脈から自明なため）。
 */
export function OpinionCard({
  opinion,
  topicPath,
}: {
  opinion: ViewerOpinion;
  topicPath?: string;
}) {
  return (
    <li className="rounded border border-gray-200 p-3">
      {topicPath && <p className="mb-1 text-xs text-gray-500">{topicPath}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        {formatRole(opinion.role, opinion.roleTitle) && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
            {formatRole(opinion.role, opinion.roleTitle)}
          </span>
        )}
        {opinion.billSentiment && (
          // タブの「懸念」（concern タグ）と紛れるので、法案への感触であることを明示する。
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
            法案への感触: {opinion.billSentiment}
          </span>
        )}
        {opinion.reasoningTypes
          .filter((type) => type !== "none")
          .map((type) => (
            <span
              key={type}
              className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
            >
              {REASONING_TYPE_LABELS[type]}
            </span>
          ))}
        {opinion.richness !== null && (
          <span className="ml-auto text-xs text-gray-500">
            充実度 {opinion.richness}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-medium">{opinion.title}</p>
      <p className="mt-1 text-sm text-gray-700">{opinion.content}</p>

      {opinion.contextualQuote && (
        <blockquote className="mt-2 border-l-2 border-gray-300 pl-2 text-sm text-gray-600">
          {opinion.contextualQuote}
        </blockquote>
      )}

      {(opinion.concern || opinion.proposal) && (
        <dl className="mt-2 flex flex-col gap-1 text-xs">
          {opinion.concern && (
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-gray-500">懸念</dt>
              <dd className="text-gray-700">{opinion.concern}</dd>
            </div>
          )}
          {opinion.proposal && (
            <div className="flex gap-1.5">
              <dt className="shrink-0 text-gray-500">提案</dt>
              <dd className="text-gray-700">{opinion.proposal}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}
