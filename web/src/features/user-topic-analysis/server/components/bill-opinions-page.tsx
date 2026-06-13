import "server-only";

import { MessageSquareText, Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { countPublicReportsByBillId } from "@/features/interview-report/server/repositories/interview-report-repository";
import { routes } from "@/lib/routes";
import { TopicOpinionList } from "../../client/components/topic-opinion-list";
import { getPublicBillOpinions } from "../loaders/get-public-bill-opinions";

interface BillOpinionsPageProps {
  billId: string;
}

/** AIインタビューの回答一覧（議案単位で公開意見をフラットに表示）。 */
export async function BillOpinionsPage({ billId }: BillOpinionsPageProps) {
  const [bill, opinions, publicReportCount, interviewConfig] =
    await Promise.all([
      getBillById(billId),
      getPublicBillOpinions(billId),
      countPublicReportsByBillId(billId),
      getInterviewConfig(billId),
    ]);

  if (!bill) {
    notFound();
  }

  const billTitle = bill.bill_content?.title || bill.name;
  const nowMs = Date.now();

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "法案詳細", href: routes.billDetail(billId) },
    { label: "インタビュー回答一覧" },
  ];

  return (
    <div className="min-h-dvh bg-mirai-surface">
      <Container>
        <div className="flex flex-col gap-8 py-8">
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

          {/* タイトル + 人数 + 説明 */}
          <div className="flex flex-col gap-4">
            <h1 className="flex items-center gap-3 font-bold leading-9 text-mirai-text">
              <span className="flex items-center gap-1 text-[22px]">
                <MessageSquareText className="size-6 shrink-0 text-primary" />
                AIインタビューの回答一覧
              </span>
              <span className="text-[20px]">{publicReportCount}人</span>
            </h1>
            <div className="flex items-center gap-2.5 rounded-[10px] bg-topic-info-bg px-3 py-2.5">
              <p className="text-[12px] leading-5 text-mirai-text">
                実際に回答されたAIインタビューの内容から、公開に同意いただいた
                <span className="font-bold">意見</span>
                を掲載しています。
              </p>
            </div>
          </div>

          {/* フィルタ + 意見カード一覧 */}
          {opinions.length > 0 ? (
            <TopicOpinionList
              opinions={opinions}
              publicReportCount={publicReportCount}
              nowMs={nowMs}
              cardVariant="answers"
            />
          ) : (
            <p className="py-8 text-center text-mirai-text-muted">
              公開されている回答はまだありません
            </p>
          )}

          {/* AIインタビューCTA */}
          {interviewConfig != null && (
            <InterviewLandingSection billId={billId} />
          )}
        </div>
      </Container>
    </div>
  );
}
