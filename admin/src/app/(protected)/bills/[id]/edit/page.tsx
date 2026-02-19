import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BillEditForm } from "@/features/bills-edit/components/bill-edit-form";
import { BillTagsForm } from "@/features/bills-edit/components/bill-tags-form";
import { getBillById } from "@/features/bills-edit/loaders/get-bill-by-id";
import { getBillTagIds } from "@/features/bills-edit/loaders/get-bill-tag-ids";
import { loadDietSessions } from "@/features/diet-sessions/server/loaders/load-diet-sessions";
import { StanceForm } from "@/features/mirai-stance/components/stance-form";
import { getStanceByBillId } from "@/features/mirai-stance/loaders/get-stance-by-bill-id";
import { loadTags } from "@/features/tags/server/loaders/load-tags";

interface BillEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BillEditPage({ params }: BillEditPageProps) {
  const { id } = await params;
  const [bill, stance, allTags, selectedTagIds, dietSessions] =
    await Promise.all([
      getBillById(id),
      getStanceByBillId(id),
      loadTags(),
      getBillTagIds(id),
      loadDietSessions(),
    ]);

  if (!bill) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/bills"
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
        <BillEditForm bill={bill} dietSessions={dietSessions} />
        <StanceForm billId={bill.id} stance={stance} billStatus={bill.status} />
        <BillTagsForm
          billId={bill.id}
          allTags={allTags}
          selectedTagIds={selectedTagIds}
        />
      </div>
    </div>
  );
}
