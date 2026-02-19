"use client";

import { Trash2 } from "lucide-react";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { deleteAdmin } from "../../server/actions/delete-admin";
import type { Admin } from "../../shared/types";

type AdminItemProps = {
  admin: Admin;
  isCurrentUser: boolean;
};

export function AdminItem({ admin, isCurrentUser }: AdminItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAdmin({ id: admin.id });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("管理者を削除しました");
      }
    } catch (error) {
      console.error("Delete admin error:", error);
      toast.error("管理者の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="font-medium">{admin.email}</span>
          {isCurrentUser && <Badge variant="secondary">自分</Badge>}
        </div>
      </TableCell>
      <TableCell className="text-gray-600">
        {formatDate(admin.created_at)}
      </TableCell>
      <TableCell className="text-gray-600">
        {formatDate(admin.last_sign_in_at)}
      </TableCell>
      <TableCell>
        {isCurrentUser ? (
          <Button variant="ghost" size="sm" disabled className="text-gray-400">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>管理者の削除</AlertDialogTitle>
                <AlertDialogDescription>
                  「{admin.email}
                  」を管理者から削除しますか？この操作は取り消せません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? "削除中..." : "削除"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}
