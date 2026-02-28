import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { loadDisclosureData } from "@/features/interview-config/server/loaders/load-disclosure-data";
import { InterviewDisclosurePage } from "@/features/interview-config/server/components/interview-disclosure-page";

interface DisclosurePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: DisclosurePageProps): Promise<Metadata> {
  const { id } = await params;
  const bill = await getBillById(id);

  if (!bill) {
    return {
      title: "議案が見つかりません",
    };
  }

  const billName = bill.bill_content?.title ?? bill.name;

  return {
    title: `AIインタビューに関する情報開示 - ${billName}`,
    description: `${billName}のAIインタビューにおける透明性および技術仕様に関する開示事項`,
  };
}

export default async function DisclosurePage({ params }: DisclosurePageProps) {
  const { id } = await params;
  const [bill, interviewConfig] = await Promise.all([
    getBillById(id),
    getInterviewConfig(id),
  ]);

  if (!bill || !interviewConfig) {
    notFound();
  }

  const disclosureData = await loadDisclosureData(bill, interviewConfig);

  return <InterviewDisclosurePage {...disclosureData} />;
}
