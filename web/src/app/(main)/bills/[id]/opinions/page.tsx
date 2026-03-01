import type { Metadata } from "next";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { PublicOpinionsPage } from "@/features/interview-report/server/components/public-opinions-page";

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
    title: `当事者の意見 - ${title}`,
    description: `${title}に対する当事者の意見一覧`,
  };
}

export default async function OpinionsPage({ params }: OpinionsPageProps) {
  const { id } = await params;
  return <PublicOpinionsPage billId={id} />;
}
