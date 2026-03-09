"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Tag } from "@/features/tags/shared/types";
import { updateBillTags } from "../../server/actions/update-bill-tags";

interface BillTagsFormProps {
  billId: string;
  allTags: Tag[];
  selectedTagIds: string[];
}

export function BillTagsForm({
  billId,
  allTags,
  selectedTagIds,
}: BillTagsFormProps) {
  const [checkedTagIds, setCheckedTagIds] = useState<Set<string>>(
    new Set(selectedTagIds)
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCheckChange = (tagId: string, checked: boolean) => {
    setCheckedTagIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(tagId);
      } else {
        newSet.delete(tagId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await updateBillTags(billId, Array.from(checkedTagIds));

      if (result.success) {
        setSuccessMessage("タグを更新しました");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || "タグの更新に失敗しました");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>タグ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allTags.length === 0 ? (
            <p className="text-sm text-gray-500">
              タグが登録されていません。先にタグを作成してください。
            </p>
          ) : (
            <div className="space-y-3">
              {allTags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={checkedTagIds.has(tag.id)}
                    onCheckedChange={(checked) =>
                      handleCheckChange(tag.id, checked === true)
                    }
                    disabled={isPending}
                  />
                  <Label
                    htmlFor={`tag-${tag.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {tag.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {allTags.length > 0 && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "保存中..." : "タグを保存"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
