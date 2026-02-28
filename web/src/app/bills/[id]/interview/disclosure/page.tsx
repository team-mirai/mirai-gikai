import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillById } from "@/features/bills/server/loaders/get-bill-by-id";
import { getInterviewConfig } from "@/features/interview-config/server/loaders/get-interview-config";
import { getInterviewQuestions } from "@/features/interview-config/server/loaders/get-interview-questions";
import { InterviewDisclosurePage } from "@/features/interview-config/server/components/interview-disclosure-page";
import { buildBulkModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/bulk-mode";
import { buildLoopModeSystemPrompt } from "@/features/interview-session/shared/utils/interview-logic/loop-mode";
import { buildSummarySystemPrompt } from "@/features/interview-session/shared/utils/build-summary-system-prompt";

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

  if (!bill) {
    notFound();
  }

  if (!interviewConfig) {
    notFound();
  }

  const questions = await getInterviewQuestions(interviewConfig.id);

  const mode = interviewConfig.mode ?? "loop";
  const buildSystemPrompt =
    mode === "bulk" ? buildBulkModeSystemPrompt : buildLoopModeSystemPrompt;

  const systemPrompt = buildSystemPrompt({
    bill,
    interviewConfig,
    questions,
    currentStage: "chat",
    askedQuestionIds: new Set(),
    remainingMinutes: null,
  });

  const summaryPrompt = buildSummarySystemPrompt({
    bill,
    interviewConfig,
    messages: [],
  });

  return (
    <InterviewDisclosurePage
      billName={bill.name}
      billTitle={bill.bill_content?.title ?? bill.name}
      interviewConfig={interviewConfig}
      questions={questions}
      systemPrompt={systemPrompt}
      summaryPrompt={summaryPrompt}
    />
  );
}
