"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getInterviewLPLink } from "@/features/interview-config/shared/utils/interview-links";
import { extractBillIdFromPath } from "@/lib/page-layout-utils";

export function InterviewHeaderActions() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSaveAndExit = () => {
    const isPreview = pathname.startsWith("/preview");
    const billId = extractBillIdFromPath(pathname);
    const previewToken = isPreview
      ? searchParams.get("token") || undefined
      : undefined;

    if (billId) {
      router.push(getInterviewLPLink(billId, previewToken));
    } else {
      router.push("/");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSaveAndExit}>
      保存して中断
    </Button>
  );
}
