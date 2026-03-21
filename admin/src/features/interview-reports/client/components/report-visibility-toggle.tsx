"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useTransition } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateReportVisibilityAction } from "../../server/actions/update-report-visibility";

interface ReportVisibilityToggleProps {
  reportId: string;
  sessionId: string;
  billId: string;
  isPublic: boolean;
  isPublicByUser: boolean;
}

export function ReportVisibilityToggle({
  reportId,
  sessionId,
  billId,
  isPublic,
  isPublicByUser,
}: ReportVisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();
  const switchId = useId();
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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">ユーザー公開:</span>
        {isPublicByUser ? (
          <span className="text-green-700 font-medium">公開</span>
        ) : (
          <span className="text-gray-500">非公開</span>
        )}
      </div>
      <div className="h-4 w-px bg-gray-300" />
      <Switch
        id={switchId}
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={isDisabled}
      />
      <Label
        htmlFor={switchId}
        className={`flex items-center gap-2 text-sm ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        {isPublic ? (
          <>
            <Eye className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">公開中</span>
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">非公開</span>
          </>
        )}
      </Label>
      {isPending && <span className="text-xs text-gray-400">更新中...</span>}
      {!isPublicByUser && !isPublic && (
        <span className="text-xs text-gray-400">
          ユーザーが非公開のため公開不可
        </span>
      )}
    </div>
  );
}
