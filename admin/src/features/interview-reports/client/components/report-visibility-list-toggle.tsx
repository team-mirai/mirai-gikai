"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateReportVisibilityAction } from "../../server/actions/update-report-visibility";

interface ReportVisibilityListToggleProps {
  reportId: string;
  sessionId: string;
  billId: string;
  isPublic: boolean;
  isPublicByUser: boolean;
}

export function ReportVisibilityListToggle({
  reportId,
  sessionId,
  billId,
  isPublic,
  isPublicByUser,
}: ReportVisibilityListToggleProps) {
  const [isPending, startTransition] = useTransition();
  const isDisabled = isPending || (!isPublicByUser && !isPublic);

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await updateReportVisibilityAction({
        reportId,
        isPublic: checked,
        billId,
        sessionId,
      });

      if (result.success) {
        toast.success(
          checked ? "レポートを公開しました" : "レポートを非公開にしました"
        );
      } else {
        toast.error(result.error || "更新に失敗しました");
      }
    });
  };

  return (
    <Switch
      checked={isPublic}
      onCheckedChange={handleToggle}
      disabled={isDisabled}
      aria-label="管理者公開設定"
    />
  );
}
