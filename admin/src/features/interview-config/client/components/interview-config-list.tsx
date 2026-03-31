"use client";

import type { Route } from "next";
import { BarChart3, Copy, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { routes } from "@/lib/routes";
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
  sessionCounts: Record<string, number> | null;
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
  sessionCounts,
}: InterviewConfigListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<InterviewConfig | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const handleOpenDeleteDialog = (config: InterviewConfig) => {
    setDeleteConfirmed(false);
    setDeleteTarget(config);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteConfirmed(false);
  };

  const handleDuplicate = async (configId: string) => {
    setIsDuplicating(configId);
    try {
      const result = await duplicateInterviewConfig(configId);
      if (result.success) {
        toast.success("インタビュー設定を複製しました");
        router.push(routes.billInterviewEdit(billId, result.data.id) as Route);
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
      handleCloseDeleteDialog();
    }
  };

  const deleteTargetSessionCount =
    deleteTarget && sessionCounts
      ? (sessionCounts[deleteTarget.id] ?? 0)
      : null;

  return (
    <>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {configs.length}件のインタビュー設定
          </div>
          <Link href={routes.billInterviewNew(billId) as Route}>
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
                  <TableHead>セッション数</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>リンク</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <Link
                        href={
                          routes.billInterviewEdit(billId, config.id) as Route
                        }
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
                    <TableCell className="max-w-[400px]">
                      {config.themes && config.themes.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {config.themes.map((theme) => (
                            <Badge
                              key={theme}
                              variant="secondary"
                              className="text-xs max-w-full truncate"
                              title={theme}
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
                      {sessionCounts ? (sessionCounts[config.id] ?? 0) : "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(config.created_at).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link
                          href={routes.billReports(billId, config.id) as Route}
                        >
                          <Button variant="ghost" size="sm" className="gap-1">
                            <BarChart3 className="h-4 w-4" />
                            レポート
                          </Button>
                        </Link>
                        <Link
                          href={
                            routes.billTopicAnalysis(billId, config.id) as Route
                          }
                        >
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Sparkles className="h-4 w-4" />
                            トピック解析
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="編集"
                              asChild
                            >
                              <Link
                                href={
                                  routes.billInterviewEdit(
                                    billId,
                                    config.id
                                  ) as Route
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>編集</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="複製"
                              onClick={() => handleDuplicate(config.id)}
                              disabled={isDuplicating === config.id}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>複製</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="削除"
                              onClick={() => handleOpenDeleteDialog(config)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>削除</TooltipContent>
                        </Tooltip>
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
        onOpenChange={(open) => !open && handleCloseDeleteDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>インタビュー設定の削除</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>「{deleteTarget?.name}」を削除しますか？</p>
                {deleteTargetSessionCount === null ? (
                  <p className="font-medium text-yellow-600">
                    セッション数を取得できませんでした。紐づくセッションが存在する可能性があります。
                  </p>
                ) : (
                  deleteTargetSessionCount > 0 && (
                    <p className="font-medium text-red-600">
                      この設定には{deleteTargetSessionCount}
                      件のセッションが紐づいています。
                    </p>
                  )
                )}
                <p>
                  この設定に関連する質問、セッション、レポートもすべて削除されます。
                  この操作は取り消せません。
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              id="delete-confirm"
              checked={deleteConfirmed}
              onCheckedChange={(checked) =>
                setDeleteConfirmed(checked === true)
              }
              disabled={isDeleting}
            />
            <Label
              htmlFor="delete-confirm"
              className="text-sm cursor-pointer select-none"
            >
              上記の内容を理解した上で削除します
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || !deleteConfirmed}
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
