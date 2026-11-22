"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateActiveSessionOverview } from "../../server/actions/update-active-session-overview";
import type { DietSession } from "../../shared/types";

type ActiveSessionOverviewFormProps = {
  session: DietSession;
};

export function ActiveSessionOverviewForm({
  session,
}: ActiveSessionOverviewFormProps) {
  const overviewId = useId();
  const router = useRouter();
  const [overview, setOverview] = useState(session.overview ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateActiveSessionOverview({
        id: session.id,
        overview,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("トップページの説明を更新しました");
      router.refresh();
    } catch (error) {
      console.error("Update active session overview error:", error);
      toast.error("トップページの説明更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={overviewId}>説明文</Label>
        <Textarea
          id={overviewId}
          value={overview}
          onChange={(event) => setOverview(event.target.value)}
          placeholder="今回の議会の特徴や審議内容を入力してください"
          rows={8}
          maxLength={500}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">
          500文字以内。未入力の場合、トップページには表示されません。
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
