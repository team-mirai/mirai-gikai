"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/routes";
import { duplicateInterviewConfig } from "../../server/actions/upsert-interview-config";
import { filterBillsForCopy } from "../utils/filter-bills-for-copy";

export interface BillOption {
  id: string;
  name: string;
}

interface CopyConfigToBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configId: string;
  configName: string;
  currentBillId: string;
  bills: BillOption[];
}

export function CopyConfigToBillDialog({
  open,
  onOpenChange,
  configId,
  configName,
  currentBillId,
  bills,
}: CopyConfigToBillDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidates = useMemo(
    () => filterBillsForCopy(bills, currentBillId, ""),
    [bills, currentBillId]
  );

  const filtered = useMemo(
    () => filterBillsForCopy(bills, currentBillId, query),
    [bills, currentBillId, query]
  );

  // 検索で見えなくなった選択肢をそのまま送信できないようにクリアする。
  useEffect(() => {
    if (selectedBillId && !filtered.some((b) => b.id === selectedBillId)) {
      setSelectedBillId(null);
    }
  }, [filtered, selectedBillId]);

  const closeDialog = () => {
    setQuery("");
    setSelectedBillId(null);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true);
      return;
    }
    // 送信中は Escape やオーバーレイクリックでの閉じ操作をブロックする。
    // 成功時は handleSubmit が closeDialog() を直接呼ぶ。
    if (isSubmitting) return;
    closeDialog();
  };

  const handleSubmit = async () => {
    if (!selectedBillId) return;
    setIsSubmitting(true);
    try {
      const result = await duplicateInterviewConfig(configId, {
        targetBillId: selectedBillId,
      });
      if (result.success) {
        toast.success("他法案へインタビュー設定を複製しました");
        setIsSubmitting(false);
        closeDialog();
        router.push(
          routes.billInterviewEdit(result.data.billId, result.data.id) as Route
        );
        return;
      }
      toast.error(result.error || "複製に失敗しました");
    } catch (error) {
      console.error("Copy interview config to bill error:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>他法案へ複製</AlertDialogTitle>
          <AlertDialogDescription>
            {`「${configName}」をコピー先の法案に複製します。コピー先では非公開状態で作成されます。`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="法案名で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              disabled={isSubmitting}
            />
          </div>
          <div
            role="listbox"
            aria-label="コピー先の法案"
            className="max-h-72 overflow-y-auto rounded-md border bg-white"
          >
            {candidates.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                コピー先となる他の法案がありません。
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                該当する法案が見つかりません。
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((bill) => {
                  const isSelected = bill.id === selectedBillId;
                  return (
                    <li key={bill.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => setSelectedBillId(bill.id)}
                        disabled={isSubmitting}
                        className={`h-auto w-full justify-start whitespace-normal rounded-none px-3 py-2 text-left text-sm font-normal ${
                          isSelected
                            ? "bg-blue-50 text-blue-900 hover:bg-blue-50 hover:text-blue-900"
                            : ""
                        }`}
                      >
                        {bill.name}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            キャンセル
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedBillId || isSubmitting}
          >
            {isSubmitting ? "複製中..." : "複製する"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
