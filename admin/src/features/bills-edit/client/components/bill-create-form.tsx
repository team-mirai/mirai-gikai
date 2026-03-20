"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";

import type { DietSession } from "@/features/diet-sessions/shared/types";
import { createBill } from "../../server/actions/create-bill";
import { type BillCreateInput, billCreateSchema } from "../../shared/types";
import { useBillForm } from "../hooks/use-bill-form";
import { BillFormFields } from "./bill-form-fields";

interface BillCreateFormProps {
  dietSessions: DietSession[];
}

export function BillCreateForm({ dietSessions }: BillCreateFormProps) {
  const { isSubmitting, error, handleSubmit, handleCancel } = useBillForm();

  // Default to the latest session (first in the list, sorted by start_date desc)
  const defaultDietSessionId =
    dietSessions.length > 0 ? dietSessions[0].id : null;

  const form = useForm<BillCreateInput>({
    resolver: zodResolver(billCreateSchema),
    defaultValues: {
      name: "",
      status: "preparing",
      originating_house: "HR",
      status_note: null,
      published_at: new Date().toISOString().slice(0, 16),
      thumbnail_url: null,
      share_thumbnail_url: null,
      shugiin_url: null,
      is_featured: false,
      diet_session_id: defaultDietSessionId,
    },
  });

  const onSubmit = (data: BillCreateInput) => {
    handleSubmit(() => createBill(data), "作成中にエラーが発生しました");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>議案新規作成</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BillFormFields
              control={form.control}
              dietSessions={dietSessions}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "作成中..." : "作成"}
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
