import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { BillOpinionsPage } from "@/features/user-topic-analysis/server/components/bill-opinions-page";

interface OpinionsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: OpinionsPageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);
  const title = bill?.bill_content?.title || bill?.name || "法案";

  return {
    title: `AIインタビューの回答一覧 - ${title}`,
    description: `${title}に寄せられたAIインタビューの回答一覧`,
  };
}

export default async function OpinionsPage({ params }: OpinionsPageProps) {
  const { id } = await params;
  return <BillOpinionsPage billId={id} />;
}
