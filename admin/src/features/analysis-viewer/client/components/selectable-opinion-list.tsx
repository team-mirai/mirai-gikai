"use client";

import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { OpinionCard } from "../../shared/components/opinion-card";
import type { FlatOpinion } from "../../shared/types";
import { buildOpinionCopyText } from "../../shared/utils/build-opinion-copy-text";

/**
 * 意見の一覧。チェックした意見を Markdown でまとめてコピーできる。
 *
 * 質問案づくりでは「懸念から3件、提案から2件」のように一覧を横断して拾うので、
 * 一覧系のビュー（懸念・具体提案・専門家根拠あり・意見検索）で共通に使う。
 *
 * 選択はビューをまたいで保持しない。ビューの切り替えは URL 遷移（Server
 * Component の再描画）なので、持ち越すには URL かストレージに載せる必要がある。
 * まずは1ビュー内で完結させ、必要になったら広げる。
 */
export function SelectableOpinionList({
  opinions,
  emptyMessage,
  billName,
  billId,
}: {
  opinions: FlatOpinion[];
  emptyMessage: string;
  billName: string;
  billId: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const selected = useMemo(
    () => opinions.filter((opinion) => selectedIds.has(opinion.id)),
    [opinions, selectedIds]
  );

  if (opinions.length === 0) {
    return (
      <p className="rounded border bg-white p-6 text-sm text-gray-500">
        {emptyMessage}
      </p>
    );
  }

  const toggle = (id: string) => {
    setCopied(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copy = async () => {
    const text = buildOpinionCopyText(selected, {
      billName,
      reportUrl: (opinion) => buildReportUrl(billId, opinion),
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  return (
    <>
      <div className="mb-2 flex items-center gap-3">
        <p className="text-sm text-gray-500">{opinions.length}件</p>
        {selected.length > 0 && (
          <>
            <p className="text-sm text-gray-700">{selected.length}件選択中</p>
            <Button type="button" size="sm" variant="outline" onClick={copy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  コピーしました
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Markdownでコピー
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedIds(new Set());
                setCopied(false);
              }}
            >
              選択解除
            </Button>
          </>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {opinions.map((opinion) => (
          <li key={opinion.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={selectedIds.has(opinion.id)}
              onChange={() => toggle(opinion.id)}
              aria-label={`${opinion.title} を選択`}
              className="mt-4 h-4 w-4 shrink-0"
            />
            <ul className="min-w-0 flex-1">
              <OpinionCard
                opinion={opinion}
                topicPath={`${opinion.bigTopicTitle} › ${opinion.mediumTopicTitle}`}
              />
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * レポート詳細の絶対URL。貼り付け先で開けるようにオリジンを付ける。
 * セッションか設定が辿れない意見では null を返し、URL 行を落とす。
 */
function buildReportUrl(billId: string, opinion: FlatOpinion): string | null {
  if (!opinion.sessionId || !opinion.configId) return null;
  const path = routes.billReportDetail(
    billId,
    opinion.configId,
    opinion.sessionId
  );
  return `${window.location.origin}${path}`;
}
