"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import type { DietSession } from "@/features/diet-sessions/shared/types";
import { updateBill } from "../../server/actions/update-bill";
import {
  type Bill,
  type BillUpdateInput,
  billUpdateSchema,
} from "../../shared/types";
import { useBillForm } from "../hooks/use-bill-form";
import { BillFormFields } from "./bill-form-fields";

interface BillEditFormProps {
  bill: Bill;
  dietSessions: DietSession[];
}

export function BillEditForm({ bill, dietSessions }: BillEditFormProps) {
  const { isSubmitting, error, handleSubmit, handleCancel } = useBillForm();

  // If bill has no diet_session_id, default to the latest session (first in the list)
  const defaultDietSessionId =
    bill.diet_session_id ??
    (dietSessions.length > 0 ? dietSessions[0].id : null);

  const form = useForm<BillUpdateInput>({
    resolver: zodResolver(billUpdateSchema),
    defaultValues: {
      name: bill.name,
      status: bill.status,
      originating_house: bill.originating_house,
      status_note: bill.status_note,
      published_at: bill.published_at
        ? new Date(bill.published_at).toISOString().slice(0, 16)
        : "",
      thumbnail_url: bill.thumbnail_url,
      share_thumbnail_url: bill.share_thumbnail_url,
      shugiin_url: bill.shugiin_url,
      is_featured: bill.is_featured,
      diet_session_id: defaultDietSessionId,
    },
  });

  const onSubmit = (data: BillUpdateInput) => {
    handleSubmit(
      () => updateBill(bill.id, data),
      "更新中にエラーが発生しました"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>議案基本情報編集</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BillFormFields
              control={form.control}
              billId={bill.id}
              dietSessions={dietSessions}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
