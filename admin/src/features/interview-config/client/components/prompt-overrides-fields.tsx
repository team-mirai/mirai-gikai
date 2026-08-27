"use client";

import { getDefaultPromptSections } from "@mirai-gikai/shared/interview-prompts/default-sections";
import {
  EDITABLE_PROMPT_SECTION_KEYS,
  PROMPT_SECTION_LABELS,
} from "@mirai-gikai/shared/interview-prompts/sections";
import type { InterviewMode } from "@mirai-gikai/shared/interview-prompts/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { InterviewConfigInput } from "../../shared/types";

interface PromptOverridesFieldsProps {
  form: UseFormReturn<InterviewConfigInput>;
  mode: InterviewMode;
}

/**
 * インタビュープロンプトのうち、聞き方に関わる節だけを編集する欄。
 *
 * 空欄ならコード側の既定値をそのまま使う。何も入力しない限り挙動は変わらない。
 * 既定値はモードによって違うので、選択中のモードのものを出す。
 */
export function PromptOverridesFields({
  form,
  mode,
}: PromptOverridesFieldsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const defaults = getDefaultPromptSections(mode);

  // 選択中のモードぶんだけを出す。他モードの文面はフォームが持ったまま残る。
  const editedCount = EDITABLE_PROMPT_SECTION_KEYS.filter((key) =>
    form.watch(`prompt_overrides.${mode}.${key}`)?.trim()
  ).length;

  return (
    <div className="rounded-lg border">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="prompt-overrides-panel"
        className="flex h-auto w-full items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-medium">
          プロンプトの調整
          {editedCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {editedCount}件を変更中
            </span>
          )}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>

      {isOpen && (
        <div
          id="prompt-overrides-panel"
          className="flex flex-col gap-6 border-t px-4 py-4"
        >
          <p className="text-sm text-muted-foreground">
            AIの聞き方を、この設定でだけ変えられます。空欄のままにすると既定の文面が使われます。
            既定の文面と同じ内容は保存されないので、あとから既定が改善されればそのまま追随します。
            クイックリプライやトピックタイトルの指示、法案情報の差し込みは、変更すると
            インタビューが正しく動かなくなるため、ここでは編集できません。
            文面はモードごとに保存されます。モードを切り替えると、そのモード用に保存した文面が出ます。
          </p>

          {EDITABLE_PROMPT_SECTION_KEYS.map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={`prompt_overrides.${mode}.${key}`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>{PROMPT_SECTION_LABELS[key].label}</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.onChange(defaults[key])}
                    >
                      既定の文面を差し込む
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      className="min-h-[140px] resize-y font-mono text-xs"
                      placeholder="空欄なら既定の文面を使います"
                    />
                  </FormControl>
                  <FormDescription>
                    {PROMPT_SECTION_LABELS[key].description}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
