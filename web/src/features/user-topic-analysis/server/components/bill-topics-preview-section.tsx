import "server-only";

import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { TopicCard } from "../../shared/components/topic-card";
import type { PublicTopic } from "../../shared/types";
import { InterviewCountPill } from "./interview-count-pill";

/** プレビューで表示するトピック数。 */
const PREVIEW_COUNT = 2;

interface BillTopicsPreviewSectionProps {
  billId: string;
  /** 公開トピック（呼び出し側で取得済みのものを渡す）。 */
  topics: PublicTopic[];
  /** 議案の公開レポート件数（ピル表示・引用→メッセージリンクの表示判定に使う）。 */
  publicReportCount: number;
}

/**
 * 議案詳細ページに差し込むトピック一覧プレビュー。
 * 公開トピックが無ければ何も描画しない。
 */
export function BillTopicsPreviewSection({
  billId,
  topics,
  publicReportCount,
}: BillTopicsPreviewSectionProps) {
  if (topics.length === 0) {
    return null;
  }

  const previewTopics = topics.slice(0, PREVIEW_COUNT);

  return (
    <div className="flex flex-col gap-4">
      {/* セクションヘッダー */}
      <Link
        href={routes.billTopics(billId) as Route}
        className="flex items-center gap-4"
      >
        <h2 className="flex items-center gap-4 font-bold leading-9 text-mirai-text">
          <span className="text-[22px]">💬法案のトピック一覧</span>
          <span className="text-[20px]">{topics.length}件</span>
        </h2>
        <ChevronRight className="size-6 shrink-0 text-primary" />
      </Link>

      {publicReportCount > 0 && (
        <InterviewCountPill
          count={publicReportCount}
          href={routes.billOpinions(billId)}
        />
      )}

      {/* トピックカード（プレビュー） */}
      <div className="flex flex-col gap-4">
        {previewTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            href={routes.billTopicDetail(billId, topic.id)}
            publicReportCount={publicReportCount}
          />
        ))}
      </div>

      {/* 一覧への導線 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="lg"
          asChild
          className="h-12 w-full gap-2.5 rounded-full border-mirai-text bg-white text-[15px] font-medium text-mirai-text hover:bg-mirai-surface-gray"
        >
          <Link href={routes.billTopics(billId) as Route}>
            トピック一覧をすべて見る
            <ChevronRight className="size-[15px] shrink-0" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
