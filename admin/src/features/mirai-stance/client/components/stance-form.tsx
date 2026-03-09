"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createStance } from "../../server/actions/create-stance";
import { deleteStance } from "../../server/actions/delete-stance";
import { updateStance } from "../../server/actions/update-stance";
import {
  type MiraiStance,
  STANCE_TYPE_LABELS,
  type StanceInput,
  stanceInputSchema,
} from "../../shared/types";

interface StanceFormProps {
  billId: string;
  stance?: MiraiStance | null;
  billStatus?: string;
}

export function StanceForm({ billId, stance, billStatus }: StanceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isPreparing = billStatus === "preparing";

  const form = useForm<StanceInput>({
    resolver: zodResolver(stanceInputSchema),
    defaultValues: {
      type: stance?.type,
      comment: stance?.comment || "",
    },
  });

  const handleSubmit = async (data: StanceInput) => {
    setIsSubmitting(true);
    try {
      const result = stance
        ? await updateStance(stance.id, data)
        : await createStance(billId, data);

      if (result.success) {
        toast.success(
          stance ? "スタンスを更新しました" : "スタンスを作成しました"
        );
        router.refresh();
      } else {
        toast.error(result.error || "エラーが発生しました");
      }
    } catch (error) {
      console.error("Error submitting stance:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!stance || !confirm("このスタンスを削除してもよろしいですか？")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteStance(stance.id);

      if (result.success) {
        toast.success("スタンスを削除しました");
        window.location.reload();
      } else {
        toast.error(result.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Error deleting stance:", error);
      toast.error("予期しないエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>チームみらいのスタンス</CardTitle>
        {isPreparing && (
          <p className="text-sm text-muted-foreground">
            法案提出前のため、スタンス設定は無効化されています。
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>スタンス</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPreparing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="スタンスを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(STANCE_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>コメント（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="スタンスについての詳細説明を入力"
                      className="min-h-[120px] resize-y"
                      disabled={isPreparing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || isPreparing}>
                {isSubmitting ? "保存中..." : stance ? "更新" : "作成"}
              </Button>
              {stance && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting || isPreparing}
                  onClick={handleDelete}
                >
                  {isDeleting ? "削除中..." : "削除"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
