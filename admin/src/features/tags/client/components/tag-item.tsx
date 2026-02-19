"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteTag } from "../../server/actions/delete-tag";
import { updateTag } from "../../server/actions/update-tag";
import type { TagWithBillCount } from "../../shared/types";

type TagItemProps = {
  tag: TagWithBillCount;
};

export function TagItem({ tag }: TagItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(tag.label);
  const [editDescription, setEditDescription] = useState(tag.description ?? "");
  const [editFeaturedPriority, setEditFeaturedPriority] = useState(
    tag.featured_priority?.toString() ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editLabel.trim()) {
      toast.error("タグ名を入力してください");
      return;
    }

    // 優先度のバリデーション
    const priority = editFeaturedPriority.trim()
      ? Number.parseInt(editFeaturedPriority, 10)
      : null;

    if (
      editFeaturedPriority.trim() !== "" &&
      (Number.isNaN(priority) || priority === null || priority < 1)
    ) {
      toast.error("優先度は1以上の数値を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateTag({
        id: tag.id,
        label: editLabel,
        description: editDescription.trim() || null,
        featured_priority: priority,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("タグを更新しました");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update tag error:", error);
      toast.error("タグの更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const result = await deleteTag({ id: tag.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("タグを削除しました");
      }
    } catch (error) {
      console.error("Delete tag error:", error);
      toast.error("タグの削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditLabel(tag.label);
    setEditDescription(tag.description ?? "");
    setEditFeaturedPriority(tag.featured_priority?.toString() ?? "");
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border p-4">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>タグ名</Label>
            <Input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>説明文</Label>
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="タグの説明を入力（任意）"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Featured優先度</Label>
            <Input
              type="number"
              value={editFeaturedPriority}
              onChange={(e) => setEditFeaturedPriority(e.target.value)}
              disabled={isSubmitting}
              placeholder="空欄でFeatured非表示"
              min="1"
            />
            <p className="text-sm text-gray-500">
              数値が小さいほど優先度が高い。空欄にするとFeaturedに表示されません。
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{tag.label}</h3>
              {tag.description && (
                <p className="text-sm text-gray-600 mt-1">{tag.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <span>({tag.bill_count}件)</span>
                {tag.featured_priority && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    Featured優先度: {tag.featured_priority}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
              >
                編集
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isSubmitting}>
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>タグの削除</AlertDialogTitle>
                    <AlertDialogDescription>
                      このタグを削除しますか？紐付けられている議案からもタグが削除されます。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      削除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
