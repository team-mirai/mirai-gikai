import "server-only";

import { Card, CardContent } from "@/components/ui/card";
import type { QuestionAnswerCount } from "../../shared/types";
import { withAnswerBarPercents } from "../../shared/utils/calc-answer-bar-percents";

interface QuestionAnswerCountsProps {
  counts: QuestionAnswerCount[];
}

export function QuestionAnswerCounts({ counts }: QuestionAnswerCountsProps) {
  const rows = withAnswerBarPercents(counts);

  return (
    <Card className="py-4">
      <CardContent className="space-y-3">
        <p className="text-sm font-semibold">質問別回答者数</p>
        <div className="space-y-1.5">
          {rows.map((count) => (
            <div
              key={count.questionId}
              className="flex items-center gap-2 text-sm"
            >
              <span className="w-8 shrink-0 text-muted-foreground">
                Q{count.questionOrder}
              </span>
              <span
                className="min-w-0 flex-1 truncate text-muted-foreground"
                title={count.question}
              >
                {count.question}
              </span>
              <div className="h-2 w-40 shrink-0 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${count.barPercent}%` }}
                />
              </div>
              <span className="w-36 shrink-0 text-right text-muted-foreground">
                回答 {count.answeredSessionCount}人 / 提示{" "}
                {count.askedSessionCount}人
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
