import "server-only";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { ReportContent } from "../../shared/components/report-content";
import { parseOpinions } from "../../shared/utils/format-utils";
import { calculateDuration } from "../../shared/utils/report-utils";
import { getPublicReportById } from "../loaders/get-public-report-by-id";

interface PublicReportPageProps {
  reportId: string;
}

export async function PublicReportPage({ reportId }: PublicReportPageProps) {
  const data = await getPublicReportById(reportId);

  if (!data) {
    notFound();
  }

  const billName = data.bill.bill_content?.title || data.bill.name;
  const opinions = parseOpinions(data.opinions);
  const duration = calculateDuration(
    data.session_started_at,
    data.session_completed_at
  );

  return (
    <div className="min-h-dvh bg-mirai-surface">
      {/* 法案サムネイル画像 */}
      {data.bill.thumbnail_url && (
        <div className="relative w-full h-[320px]">
          <Image
            src={data.bill.thumbnail_url}
            alt={billName}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* ヘッダーセクション */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-center text-gray-800">
            インタビューレポート
          </h1>
          <Link
            href={getBillDetailLink(data.bill_id)}
            className="text-sm text-black underline"
          >
            {billName}
          </Link>
        </div>
      </div>

      {/* レポート本体（共通コンポーネント） */}
      <div className="px-4 py-8">
        <ReportContent
          reportId={reportId}
          billId={data.bill_id}
          summary={data.summary}
          stance={data.stance}
          role={data.role}
          sessionStartedAt={data.session_started_at}
          duration={duration}
          characterCount={data.characterCount}
          roleDescription={data.role_description}
          opinions={opinions}
        />
      </div>
    </div>
  );
}
