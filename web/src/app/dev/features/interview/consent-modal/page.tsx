"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InterviewConsentModal } from "@/features/interview-config/client/components/interview-consent-modal";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";

export default function ConsentModalPreview() {
  const [openDefault, setOpenDefault] = useState(false);

  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        InterviewConsentModal
      </h1>

      <ComponentShowcase
        title="Default"
        description="AIインタビュー同意モーダル"
      >
        <PreviewSection label="通常表示">
          <Button onClick={() => setOpenDefault(true)}>モーダルを開く</Button>
          <InterviewConsentModal
            open={openDefault}
            onOpenChange={setOpenDefault}
            billId="mock-bill-001"
          />
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
