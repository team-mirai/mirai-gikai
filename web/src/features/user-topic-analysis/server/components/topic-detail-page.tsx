import "server-only";

import { ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { countPublicReportsByBillId } from "@/features/interview-report/server/repositories/interview-report-repository";
import { routes } from "@/lib/routes";
import { TopicOpinionList } from "../../client/components/topic-opinion-list";
import {
  TopicCategoryChips,
  TopicSentiment,
} from "../../shared/components/topic-meta";
import {
  type TopicFilter,
  topicFilterLabel,
} from "../../shared/utils/filter-topics";
import { getPublicTopicDetail } from "../loaders/get-public-topic-detail";

function TopicNav({
  billId,
  position,
  total,
  prevTopicId,
  nextTopicId,
  filter,
}: {
  billId: string;
  position: number;
  total: number;
  prevTopicId: string | null;
  nextTopicId: string | null;
  filter: TopicFilter;
}) {
  return (
    <div className="flex items-center justify-between text-[13px] font-medium text-mirai-text">
      {prevTopicId ? (
        <Link
          href={routes.billTopicDetail(billId, prevTopicId, filter) as Route}
          className="flex items-center gap-1 text-primary-accent hover:underline"
        >
          <ChevronLeft className="size-4 shrink-0" />
          前のトピック
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-mirai-text-muted">
          <ChevronLeft className="size-4 shrink-0" />
          前のトピック
        </span>
      )}

      <span className="text-mirai-text-muted">
        {position}/{total}
      </span>

      {nextTopicId ? (
        <Link
          href={routes.billTopicDetail(billId, nextTopicId, filter) as Route}
          className="flex items-center gap-1 text-primary-accent hover:underline"
        >
          次のトピック
          <ChevronRight className="size-4 shrink-0" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 text-mirai-text-muted">
          次のトピック
          <ChevronRight className="size-4 shrink-0" />
        </span>
      )}
    </div>
  );
}

interface TopicDetailPageProps {
  billId: string;
  topicId: string;
  /** 一覧から引き継いだフィルタ。前後トピックの並びとリンクに反映する。 */
  filter?: TopicFilter;
}

export async function TopicDetailPage({
  billId,
  topicId,
  filter = "all",
}: TopicDetailPageProps) {
  const [bill, detail, publicReportCount] = await Promise.all([
    getBillById(billId),
    getPublicTopicDetail(billId, topicId, filter),
    countPublicReportsByBillId(billId),
  ]);

  if (!bill || !detail) {
    notFound();
  }

  // 相対日時はサーバーで基準時刻を固定し、クライアントでの再計算ずれを防ぐ。
  const nowMs = Date.now();

  const { topic, position, total, prevTopicId, nextTopicId } = detail;
  const billTitle = bill.bill_content?.title || bill.name;

  const filterLabel = topicFilterLabel(filter);
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "法案詳細", href: routes.billDetail(billId) },
    {
      label: filterLabel ? `トピック一覧（${filterLabel}）` : "トピック一覧",
      href: routes.billTopics(billId),
    },
    { label: "トピック詳細" },
  ];

  return (
    <div className="min-h-dvh bg-mirai-surface">
      <Container>
        <div className="flex flex-col gap-6 py-8">
          {/* パンくず + 法案タイトル */}
          <div className="flex flex-col gap-2">
            <Breadcrumb items={breadcrumbItems} />
            <Link
              href={routes.billDetail(billId) as Route}
              className="inline-flex items-center gap-2 text-[15px] font-medium leading-6 text-black"
            >
              <span className="underline">{billTitle}</span>
              <Undo2 className="size-4 shrink-0" />
            </Link>
          </div>

          <h1 className="text-[22px] font-bold leading-9 text-mirai-text">
            💬法案のトピック詳細
          </h1>

          <TopicNav
            billId={billId}
            position={position}
            total={total}
            prevTopicId={prevTopicId}
            nextTopicId={nextTopicId}
            filter={filter}
          />

          {/* トピックヘッダー */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-bold leading-6 text-mirai-text">
              {topic.title}
              <span className="ml-1 text-[11px] font-medium text-topic-count">
                （{topic.opinion_count}件）
              </span>
            </h2>
            <TopicSentiment sentiment={topic.sentiment} />
            <TopicCategoryChips topic={topic} />
            {topic.description && (
              <p className="text-[15px] leading-6 text-mirai-text">
                {topic.description}
              </p>
            )}
          </div>

          {/* 意見一覧 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold text-topic-label">
              このトピックに含まれる{topic.opinion_count}件の意見
            </h3>
            <TopicOpinionList
              opinions={topic.opinions}
              publicReportCount={publicReportCount}
              nowMs={nowMs}
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
