"use client";

import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteInterviewConfig,
  duplicateInterviewConfig,
} from "../../server/actions/upsert-interview-config";
import type { InterviewConfig } from "../../shared/types";

interface InterviewConfigListProps {
  billId: string;
  configs: InterviewConfig[];
}

function getModeLabel(mode: InterviewConfig["mode"]): string {
  switch (mode) {
    case "loop":
      return "ループ";
    case "bulk":
      return "一括";
    default:
      return mode;
  }
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
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {configs.length}件のインタビュー設定
          </div>
          <Link href={`/bills/${billId}/interview/new`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </Link>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            インタビュー設定がありません。新規作成してください。
          </div>
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>設定名</TableHead>
                  <TableHead>モード</TableHead>
                  <TableHead>テーマ</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <Link
                        href={`/bills/${billId}/interview/${config.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {config.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getModeLabel(config.mode)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {config.themes && config.themes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {config.themes.map((theme) => (
                            <Badge
                              key={theme}
                              variant="secondary"
                              className="text-xs"
                            >
                              {theme}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          config.status === "public" ? "default" : "secondary"
                        }
                        className="w-16 justify-center"
                      >
                        {config.status === "public" ? "公開" : "非公開"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(config.created_at).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/bills/${billId}/interview/${config.id}/edit`}
                        >
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(config.id)}
                          disabled={isDuplicating === config.id}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(config)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

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
