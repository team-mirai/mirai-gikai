"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setVersionPublishedAction } from "../../server/actions/publish-actions";

/** completed version を公開／非公開に切り替えるボタン（§7・Admin 手動操作）。 */
export function PublishToggleButton({
  versionId,
  billId,
  isPublished,
}: {
  versionId: string;
  billId: string;
  isPublished: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={isPublished ? "outline" : "default"}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await setVersionPublishedAction({
            versionId,
            billId,
            published: !isPublished,
          });
        })
      }
    >
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {isPublished ? "非公開にする" : "公開する"}
    </Button>
  );
}
