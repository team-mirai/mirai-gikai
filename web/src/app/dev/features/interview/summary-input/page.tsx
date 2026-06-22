"use client";

import { useState } from "react";
import { InterviewSummaryInput } from "@/features/interview-session/client/components/interview-summary-input";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";

export default function SummaryInputPreview() {
  const [input, setInput] = useState("");

  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        InterviewSummaryInput
      </h1>

      <ComponentShowcase
        title="No Report（レポート未生成時の安全網）"
        description="summaryフェーズに来たがレポートを生成できなかった場合。理由を伝え、インタビュー続行/終了を選べる。"
      >
        <PreviewSection label="hasReport = false">
          <div className="w-full max-w-md">
            <InterviewSummaryInput
              sessionId="mock-session-001"
              billId="mock-bill-001"
              hasReport={false}
              input={input}
              onInputChange={setInput}
              onSubmit={() => {}}
              isLoading={false}
              error={null}
            />
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase
        title="With Report（レポート生成済み）"
        description="レポートが生成された通常時。内容に同意して提出するボタンと、修正要望の入力欄を表示。"
      >
        <PreviewSection label="hasReport = true">
          <div className="w-full max-w-md">
            <InterviewSummaryInput
              sessionId="mock-session-001"
              billId="mock-bill-001"
              hasReport={true}
              input={input}
              onInputChange={setInput}
              onSubmit={() => {}}
              isLoading={false}
              error={null}
            />
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
