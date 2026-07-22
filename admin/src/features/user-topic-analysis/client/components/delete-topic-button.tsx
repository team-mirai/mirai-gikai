"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTopicAction } from "../../server/actions/delete-topic-actions";

/** 個別トピックを削除するボタン（LLM の誤割当トピックを取り除く手動操作）。 */
export function DeleteTopicButton({
  topicId,
  versionId,
  billId,
  title,
}: {
  topicId: string;
  versionId: string;
  billId: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        const confirmed = window.confirm(
          `トピック「${title}」を削除しますか？ 紐づく意見の割当も削除されます（意見自体は削除されません）。この操作は取り消せません。`
        );
        if (!confirmed) return;
        startTransition(async () => {
          await deleteTopicAction({ topicId, versionId, billId });
        });
      }}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      削除
    </Button>
  );
}
