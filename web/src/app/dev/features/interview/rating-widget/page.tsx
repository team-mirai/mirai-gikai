"use client";

import { useCallback, useState } from "react";
import { InterviewRatingWidget } from "@/features/interview-session/client/components/interview-rating-widget";
import { Button } from "@/components/ui/button";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";

export default function RatingWidgetPreview() {
  const [visibleDefault, setVisibleDefault] = useState(true);
  const [visibleMobile, setVisibleMobile] = useState(true);

  const resetDefault = useCallback(() => setVisibleDefault(true), []);
  const resetMobile = useCallback(() => setVisibleMobile(true), []);

  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        InterviewRatingWidget
      </h1>

      <ComponentShowcase
        title="Default"
        description="インタビュー中の満足度評価ウィジェット（星1〜5）。星3以下でフィードバックタグ選択UIを表示。"
      >
        <PreviewSection label="Rating Phase">
          <div className="w-full max-w-md">
            {visibleDefault ? (
              <InterviewRatingWidget
                sessionId="mock-session-001"
                onDismiss={() => setVisibleDefault(false)}
              />
            ) : (
              <Button onClick={resetDefault}>ウィジェットを再表示</Button>
            )}
          </div>
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase
        title="Mobile Width"
        description="モバイル幅でのレイアウト確認"
      >
        <PreviewSection label="幅320px">
          <div className="w-[320px]">
            {visibleMobile ? (
              <InterviewRatingWidget
                sessionId="mock-session-002"
                onDismiss={() => setVisibleMobile(false)}
              />
            ) : (
              <Button onClick={resetMobile}>ウィジェットを再表示</Button>
            )}
          </div>
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
