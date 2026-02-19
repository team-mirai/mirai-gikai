"use client";

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { env } from "@/lib/env";
import { deleteDietSession } from "../../server/actions/delete-diet-session";
import { setActiveDietSession } from "../../server/actions/set-active-diet-session";
import { updateDietSession } from "../../server/actions/update-diet-session";
import type { DietSession } from "../../shared/types";

type DietSessionItemProps = {
  session: DietSession;
};

export function DietSessionItem({ session }: DietSessionItemProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const [editSlug, setEditSlug] = useState(session.slug ?? "");
  const [editShugiinUrl, setEditShugiinUrl] = useState(
    session.shugiin_url ?? ""
  );
  const [editStartDate, setEditStartDate] = useState(session.start_date);
  const [editEndDate, setEditEndDate] = useState(session.end_date);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("国会名を入力してください");
      return;
    }

    if (!editStartDate) {
      toast.error("開始日を入力してください");
      return;
    }

    if (!editEndDate) {
      toast.error("終了日を入力してください");
      return;
    }

    // 変更がない場合は編集モードを終了
    if (
      editName === session.name &&
      editSlug === (session.slug ?? "") &&
      editShugiinUrl === (session.shugiin_url ?? "") &&
      editStartDate === session.start_date &&
      editEndDate === session.end_date
    ) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateDietSession({
        id: session.id,
        name: editName,
        slug: editSlug || null,
        shugiin_url: editShugiinUrl || null,
        start_date: editStartDate,
        end_date: editEndDate,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("国会会期を更新しました");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update diet session error:", error);
      toast.error("国会会期の更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      const result = await deleteDietSession({ id: session.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("国会会期を削除しました");
      }
    } catch (error) {
      console.error("Delete diet session error:", error);
      toast.error("国会会期の削除に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditName(session.name);
    setEditSlug(session.slug ?? "");
    setEditShugiinUrl(session.shugiin_url ?? "");
    setEditStartDate(session.start_date);
    setEditEndDate(session.end_date);
    setIsEditing(false);
  };

  const handleSetActive = async () => {
    setIsSubmitting(true);

    try {
      const result = await setActiveDietSession({ id: session.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `「${session.name}」をアクティブな国会会期に設定しました`
        );
        router.refresh();
      }
    } catch (error) {
      console.error("Set active diet session error:", error);
      toast.error("アクティブ設定に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        {isEditing ? (
          <div className="flex-1 space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="国会名"
                disabled={isSubmitting}
              />
              <Input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="スラッグ（例: 219-rinji）"
                disabled={isSubmitting}
              />
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                disabled={isSubmitting}
              />
              <Input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Input
              type="url"
              value={editShugiinUrl}
              onChange={(e) => setEditShugiinUrl(e.target.value)}
              placeholder="衆議院URL（https://www.shugiin.go.jp/...）"
              disabled={isSubmitting}
            />
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2 font-medium">
              {session.name}
              {session.is_active && (
                <Badge variant="default" className="bg-green-600">
                  アクティブ
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {session.slug && (
                <Link
                  href={`${env.webUrl}/kokkai/${session.slug}/bills`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mr-2 text-blue-600 hover:underline"
                >
                  /{session.slug}
                </Link>
              )}
              {formatDate(session.start_date)} 〜 {formatDate(session.end_date)}
            </div>
            {session.shugiin_url && (
              <div className="text-sm text-gray-500 mt-1">
                <a
                  href={session.shugiin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  衆議院ページ ↗
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </>
          ) : (
            <>
              {!session.is_active && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      アクティブにする
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-orange-600">
                        アクティブな国会会期の変更
                      </AlertDialogTitle>
                      <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>
                            「{session.name}
                            」をアクティブな国会会期に設定しますか？
                          </p>
                          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-orange-800">
                            <p className="font-semibold">
                              この操作はトップページに影響します
                            </p>
                            <ul className="mt-2 list-disc list-inside text-sm">
                              <li>
                                トップページに表示される法案が、この国会会期の法案に切り替わります
                              </li>
                              <li>
                                現在アクティブな国会会期は非アクティブになります
                              </li>
                              <li>
                                ユーザーがトップページで確認できる法案が変わります
                              </li>
                            </ul>
                          </div>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>キャンセル</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSetActive}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        アクティブにする
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

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
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    削除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>国会会期の削除</AlertDialogTitle>
                    <AlertDialogDescription>
                      この国会会期を削除しますか？この操作は取り消せません。
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
