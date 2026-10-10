"use client";

import {
  ARTICLE_REPORT_CATEGORIES,
  ARTICLE_REPORT_CATEGORY_LABELS,
  type ArticleReportCategory,
} from "@mirai-gikai/shared/article-report/categories";
import { Check, Flag } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DifficultyLevelEnum } from "@/features/bill-difficulty/shared/types";
import { cn } from "@/lib/utils";
import { submitArticleReport } from "../../server/actions/submit-article-report";
import {
  ARTICLE_REPORT_BODY_MAX_LENGTH,
  hasArticleReportBody,
} from "../../shared/utils/article-report-input";

type Step = "idle" | "form" | "sent";

export function ArticleReportForm({
  billId,
  difficultyLevel,
}: {
  billId: string;
  difficultyLevel: DifficultyLevelEnum;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [category, setCategory] = useState<ArticleReportCategory | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = hasArticleReportBody(body) && !isPending;

  const close = () => {
    setStep("idle");
    setCategory(null);
    setBody("");
    setError(null);
  };

  const submit = () => {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      const result = await submitArticleReport({
        billId,
        difficultyLevel,
        category: category ?? undefined,
        body,
      });
      if (result.ok) {
        setStep("sent");
      } else {
        setError(result.error);
      }
    });
  };

  if (step === "idle") {
    return (
      <Button
        variant="outline"
        onClick={() => setStep("form")}
        className="self-end h-7 gap-[5px] px-[11px] has-[>svg]:px-[11px] border-mirai-border bg-white text-xs font-bold text-mirai-text shadow-none hover:bg-white hover:opacity-70 [&_svg:not([class*='size-'])]:size-3"
      >
        <Flag />
        誤りを報告する
      </Button>
    );
  }

  if (step === "sent") {
    return (
      <div
        role="status"
        className="flex items-start gap-2 rounded-[12px] bg-white px-3.5 py-3"
      >
        <Check
          className="size-4 shrink-0 mt-0.5 text-primary"
          strokeWidth={2.5}
        />
        <p className="text-[13px] font-medium leading-[1.6] text-mirai-text">
          報告ありがとうございます。いただいた内容は確認のうえ、記事の改善に使わせていただきます。
        </p>
      </div>
    );
  }

  return (
    <>
      <form
        className="flex flex-col gap-3 rounded-[12px] bg-white p-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">誤りの種類</legend>
          {ARTICLE_REPORT_CATEGORIES.map((value) => {
            const selected = category === value;
            return (
              <Button
                key={value}
                type="button"
                variant="outline"
                aria-pressed={selected}
                disabled={isPending}
                onClick={() => setCategory(selected ? null : value)}
                className={cn(
                  "h-auto min-h-9 px-3 py-0 bg-white text-[13px] font-bold shadow-none hover:bg-white",
                  selected
                    ? "border-primary text-primary-accent"
                    : "border-mirai-border text-mirai-text"
                )}
              >
                {ARTICLE_REPORT_CATEGORY_LABELS[value]}
              </Button>
            );
          })}
        </fieldset>
        <Textarea
          required
          aria-required="true"
          aria-label="誤りの内容"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="どの部分が、どう違っていたか"
          rows={3}
          maxLength={ARTICLE_REPORT_BODY_MAX_LENGTH}
          className="block field-sizing-fixed resize-y border-mirai-border bg-white px-3 py-2.5 text-[13px] leading-[1.6] text-mirai-text shadow-none placeholder:text-mirai-text-placeholder md:text-[13px] focus:outline-solid focus:outline-2 focus:outline-offset-0 focus:outline-primary focus-visible:border-mirai-border focus-visible:ring-0"
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={close}
            className="h-auto min-h-10 px-3.5 py-0 bg-transparent text-[13px] font-bold text-mirai-text-muted hover:bg-transparent hover:text-mirai-text-muted hover:opacity-70"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "h-auto min-h-10 px-5 py-0 border-0 text-[13px] font-bold shadow-none disabled:opacity-100",
              hasArticleReportBody(body)
                ? "bg-mirai-gradient text-black"
                : "bg-mirai-surface-muted text-mirai-text-muted"
            )}
          >
            {isPending ? "送信中…" : "送信する"}
          </Button>
        </div>
      </form>
      {error && (
        <p role="alert" className="text-[13px] leading-[1.6] text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
