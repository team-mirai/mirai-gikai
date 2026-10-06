"use client";

import { Plus, Trash2 } from "lucide-react";
import { type Control, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import type { StanceFormValues } from "../../shared/types";

interface ReasonNewFormatFieldsProps {
  control: Control<StanceFormValues>;
  disabled: boolean;
}

/** 新フォーマットの判断の理由（一言 + 箇条書き + 補足情報）の入力欄 */
export function ReasonNewFormatFields({
  control,
  disabled,
}: ReasonNewFormatFieldsProps) {
  const points = useFieldArray({ control, name: "reasonPoints" });
  const supplements = useFieldArray({ control, name: "supplements" });

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="reasonSummary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>判断の理由（一言）</FormLabel>
            <FormControl>
              <Input
                placeholder="例: 利益相反への手当てを条件に、供給力確保を優先し賛成します。"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              30字以内・スマホで2行以内が目安です。
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormLabel>箇条書き</FormLabel>
        <p className="text-sm text-muted-foreground">
          「認める点 → 懸念 →
          結論」の順で書くと、賛否どちらでも同じ読み方ができます。空欄の項目は保存されません。
        </p>
        {points.fields.map((item, index) => (
          <FormField
            key={item.id}
            control={control}
            name={`reasonPoints.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <div className="flex gap-2">
                  <FormControl>
                    <Textarea
                      className="min-h-[60px] resize-y"
                      placeholder={`${index + 1}つ目の項目`}
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${index + 1}つ目の項目を削除`}
                    disabled={disabled}
                    onClick={() => points.remove(index)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </FormItem>
            )}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => points.append({ value: "" })}
        >
          <Plus />
          項目を追加
        </Button>
      </div>

      <div className="space-y-2">
        <FormLabel>補足情報（任意）</FormLabel>
        <p className="text-sm text-muted-foreground">
          公開サイトでは開閉式で表示され、見出しごとに区切られます。本文は
          Markdown（箇条書き・表など）で記述できます。「-
          小見出し：本文」の形の箇条は小見出しを太字で表示します。
        </p>
        {supplements.fields.map((item, index) => (
          <div key={item.id} className="space-y-2 rounded-md border p-4">
            <div className="flex gap-2">
              <FormField
                control={control}
                name={`supplements.${index}.title`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        placeholder="見出し（例: 今後の働きかけ / 各議員の判断）"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`補足情報${index + 1}を削除`}
                disabled={disabled}
                onClick={() => supplements.remove(index)}
              >
                <Trash2 />
              </Button>
            </div>
            <FormField
              control={control}
              name={`supplements.${index}.body`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="本文（Markdown）"
                      className="min-h-[120px] resize-y font-mono text-sm"
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => supplements.append({ title: "", body: "" })}
        >
          <Plus />
          補足情報を追加
        </Button>
      </div>
    </div>
  );
}
