import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BillEditForm } from "@/features/bills-edit/client/components/bill-edit-form";
import { BillTagsForm } from "@/features/bills-edit/client/components/bill-tags-form";
import { BillVideosForm } from "@/features/bills-edit/client/components/bill-videos-form";
import { BreakingNewsImageGenerator } from "@/features/bills-edit/client/components/breaking-news-image-generator";
import { getBillById } from "@/features/bills-edit/server/loaders/get-bill-by-id";
import { getBillContents } from "@/features/bills-edit/server/loaders/get-bill-contents";
import { getBillTagIds } from "@/features/bills-edit/server/loaders/get-bill-tag-ids";
import { getBillVideos } from "@/features/bills-edit/server/loaders/get-bill-videos";
import { toBreakingNewsStance } from "@/features/bills-edit/shared/utils/breaking-news-image";
import { loadDietSessions } from "@/features/diet-sessions/server/loaders/load-diet-sessions";
import { StanceForm } from "@/features/mirai-stance/client/components/stance-form";
import { getStanceByBillId } from "@/features/mirai-stance/server/loaders/get-stance-by-bill-id";
import { SupplementaryResolutionForm } from "@/features/supplementary-resolution/client/components/supplementary-resolution-form";
import { getSupplementaryResolutionByBillId } from "@/features/supplementary-resolution/server/loaders/get-supplementary-resolution-by-bill-id";
import { loadTags } from "@/features/tags/server/loaders/load-tags";
import { routes } from "@/lib/routes";

interface BillEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillEditPage({ params }: BillEditPageProps) {
  const { id } = await params;
  const [
    bill,
    stance,
    supplementaryResolution,
    allTags,
    selectedTagIds,
    dietSessions,
    contents,
    videos,
  ] = await Promise.all([
    getBillById(id),
    getStanceByBillId(id),
    getSupplementaryResolutionByBillId(id),
    loadTags(),
    getBillTagIds(id),
    loadDietSessions(),
    getBillContents(id),
    getBillVideos(id),
  ]);

  if (!bill) {
    notFound();
  }

  const normalTitle = contents.find(
    (content) => content.difficulty_level === "normal"
  )?.title;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={routes.bills()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          議案一覧に戻る
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">議案編集</h1>
        <p className="text-gray-600 mt-1">議案の基本情報を編集します</p>
      </div>

      <div className="space-y-6">
        <BillEditForm
          bill={bill}
          dietSessions={dietSessions}
          shareImageDefaultTitle={normalTitle || bill.name}
        />
        <StanceForm billId={bill.id} stance={stance} billStatus={bill.status} />
        <SupplementaryResolutionForm
          // 保存・削除後の refresh で、サーバー側で正規化した値をフォームに反映する
          key={supplementaryResolution?.updated_at ?? "none"}
          billId={bill.id}
          resolution={supplementaryResolution}
        />
        <BillVideosForm billId={bill.id} videos={videos} />
        <BillTagsForm
          billId={bill.id}
          allTags={allTags}
          selectedTagIds={selectedTagIds}
        />
        <BreakingNewsImageGenerator
          billId={bill.id}
          originatingHouse={bill.originating_house}
          proposalType={bill.proposal_type}
          defaultTitle={normalTitle || bill.name}
          publishedStance={toBreakingNewsStance(stance, new Date())}
        />
      </div>
    </div>
  );
}
