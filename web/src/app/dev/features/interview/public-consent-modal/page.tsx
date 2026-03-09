"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InterviewPublicConsentModal } from "@/features/interview-report/client/components/interview-public-consent-modal";
import { MakePublicModal } from "@/features/interview-report/client/components/make-public-modal";
import { MakePrivateModal } from "@/features/interview-report/client/components/make-private-modal";
import { ComponentShowcase } from "../../../_components/component-showcase";
import { PreviewSection } from "../../../_components/preview-section";

export default function PublicConsentModalPreview() {
  const [openConsent, setOpenConsent] = useState(false);
  const [openMakePublic, setOpenMakePublic] = useState(false);
  const [openMakePrivate, setOpenMakePrivate] = useState(false);

  return (
    <>
      <h1 className="text-3xl font-bold text-mirai-text mb-8">
        公開設定モーダル
      </h1>

      <ComponentShowcase
        title="InterviewPublicConsentModal"
        description="インタビュー終了時の公開設定モーダル"
      >
        <PreviewSection label="通常表示">
          <Button onClick={() => setOpenConsent(true)}>モーダルを開く</Button>
          <InterviewPublicConsentModal
            open={openConsent}
            onOpenChange={setOpenConsent}
            onSubmit={() => setOpenConsent(false)}
            isSubmitting={false}
          />
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase
        title="MakePublicModal"
        description="非公開→公開に切り替えるモーダル"
      >
        <PreviewSection label="通常表示">
          <Button onClick={() => setOpenMakePublic(true)}>
            モーダルを開く
          </Button>
          <MakePublicModal
            open={openMakePublic}
            onOpenChange={setOpenMakePublic}
            onConfirm={() => setOpenMakePublic(false)}
            isSubmitting={false}
          />
        </PreviewSection>
      </ComponentShowcase>

      <ComponentShowcase
        title="MakePrivateModal"
        description="公開→非公開に切り替えるモーダル"
      >
        <PreviewSection label="通常表示">
          <Button onClick={() => setOpenMakePrivate(true)}>
            モーダルを開く
          </Button>
          <MakePrivateModal
            open={openMakePrivate}
            onOpenChange={setOpenMakePrivate}
            onConfirm={() => setOpenMakePrivate(false)}
            isSubmitting={false}
          />
        </PreviewSection>
      </ComponentShowcase>
    </>
  );
}
