import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { PublicOpinionsPage } from "@/features/interview-report/server/components/public-opinions-page";
import { parseSortOrder } from "@/features/interview-report/shared/utils/sort-order";
import { parseStanceFilter } from "@/features/interview-report/shared/utils/stance-filter";

interface OpinionsPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    stance?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({
  params,
}: OpinionsPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const title = bill?.bill_content?.title || bill?.name || "法案";

  return {
    title: `当事者の意見 - ${title}`,
    description: `${title}に対する当事者の意見一覧`,
  };
}

export default async function OpinionsPage({
  params,
  searchParams,
}: OpinionsPageProps) {
  const { id } = await params;
  const { stance, sort } = await searchParams;

  return (
    <PublicOpinionsPage
      billId={id}
      initialFilter={parseStanceFilter(stance ?? null)}
      initialSort={parseSortOrder(sort ?? null)}
    />
  );
}
