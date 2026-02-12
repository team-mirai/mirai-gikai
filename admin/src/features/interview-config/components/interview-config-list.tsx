"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { InterviewConfig } from "../types";
import {
  deleteInterviewConfig,
  duplicateInterviewConfig,
} from "../actions/upsert-interview-config";

interface InterviewConfigListProps {
  billId: string;
  configs: InterviewConfig[];
}

export function InterviewConfigList({
  billId,
  configs,
}: InterviewConfigListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<InterviewConfig | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const handleDuplicate = async (configId: string) => {
    setIsDuplicating(configId);
    try {
      const result = await duplicateInterviewConfig(configId);
      if (result.success) {
        toast.success("インタビュー設定を複製しました");
        router.push(`/bills/${billId}/interview/${result.data.id}/edit`);
      } else {
        toast.error(result.error || "複製に失敗しました");
      }
    } catch (error) {
      console.error("Duplicate interview config error:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteInterviewConfig(deleteTarget.id);
      if (result.success) {
        toast.success("インタビュー設定を削除しました");
        router.refresh();
      } else {
        toast.error(result.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Delete interview config error:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>インタビュー設定一覧</CardTitle>
          <Link href={`/bills/${billId}/interview/new`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              インタビュー設定がありません。新規作成してください。
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-gray-500">
                        作成日:{" "}
                        {new Date(config.created_at).toLocaleDateString(
                          "ja-JP"
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        config.status === "public" ? "default" : "secondary"
                      }
                    >
                      {config.status === "public" ? "公開" : "非公開"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/bills/${billId}/interview/${config.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-4 w-4" />
                        編集
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(config.id)}
                      disabled={isDuplicating === config.id}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {isDuplicating === config.id ? "複製中..." : "複製"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(config)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>インタビュー設定の削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.name}」を削除しますか？
              この設定に関連する質問、セッション、レポートもすべて削除されます。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
