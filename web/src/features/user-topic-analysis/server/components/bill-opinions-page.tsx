import "server-only";

import { Info, Undo2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { InterviewLandingSection } from "@/features/interview-config/client/components/interview-landing-section";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { routes } from "@/lib/routes";
import { RespondentList } from "../../client/components/respondent-list";
import { getPublicBillRespondents } from "../loaders/get-public-bill-respondents";

interface BillOpinionsPageProps {
  billId: string;
}

/** AIインタビューの回答一覧（議案単位で公開レポートを回答者ごとに表示）。 */
export async function BillOpinionsPage({ billId }: BillOpinionsPageProps) {
  const [bill, respondents, interviewConfig] = await Promise.all([
    getBillById(billId),
    getPublicBillRespondents(billId),
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
              <span className="text-[22px]">👫AIインタビューの回答一覧</span>
              <span className="text-[20px]">{respondents.length}人</span>
            </h1>
            <div className="flex items-center gap-2.5 rounded-[10px] bg-topic-info-bg px-3 py-2.5">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-white">
                <Info className="size-3 text-primary-accent" />
              </span>
              <p className="text-[12px] leading-5 text-mirai-text">
                実際に回答された一人ひとりのAIインタビューの内容と、会話ログを読むことができます。公開に同意されたインタビュー回答のみ掲載しています。
              </p>
            </div>
          </div>

          {/* フィルタ + 回答者カード一覧 */}
          {respondents.length > 0 ? (
            <RespondentList respondents={respondents} nowMs={nowMs} />
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
