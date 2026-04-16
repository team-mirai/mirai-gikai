import type { SimulatedTurn } from "../../shared/schemas";
import { isShortAnswer } from "../../shared/utils/format-transcript";

interface TranscriptViewerProps {
  /** 再構成済みターン（interviewer / interviewee の text のみ） */
  turns: Array<{
    role: "interviewer" | "interviewee";
    content: string;
    topic_title?: string | null;
    question_id?: string | null;
    next_stage?: SimulatedTurn["next_stage"];
    /** インタビュアーが提示した選択肢 */
    quick_replies?: string[] | null;
  }>;
  emptyMessage?: string;
}

const ROLE_LABEL: Record<"interviewer" | "interviewee", string> = {
  interviewer: "インタビュアー",
  interviewee: "インタビュイー",
};

/**
 * 会話ログをカード形式で表示する。
 * インタビュアーは青系、インタビュイーは緑系で塗り分け、
 * インタビュイーの短答（15文字以下）は黄色背景でハイライト。
 */
export function TranscriptViewer({
  turns,
  emptyMessage = "会話なし",
}: TranscriptViewerProps) {
  if (turns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
    );
  }

  return (
    <ol className="space-y-3">
      {turns.map((t, idx) => {
        const isInterviewer = t.role === "interviewer";
        const baseClass = isInterviewer
          ? "border bg-muted/40"
          : "border-blue-200 bg-blue-50";
        const highlightClass =
          !isInterviewer && isShortAnswer(t.content)
            ? "ring-1 ring-muted-foreground/40"
            : "";
        const meta: string[] = [];
        if (t.topic_title) meta.push(`topic: ${t.topic_title}`);
        if (t.question_id) meta.push(`q: ${t.question_id}`);
        if (t.next_stage && t.next_stage !== "chat") {
          meta.push(`next: ${t.next_stage}`);
        }

        return (
          <li
            key={`${idx}-${t.role}`}
            className={`rounded-md border p-3 ${baseClass} ${highlightClass}`}
          >
            <div className="mb-1.5 text-xs">
              <span className="font-semibold">
                {idx + 1}. {ROLE_LABEL[t.role]}
              </span>
              {meta.length > 0 && (
                <div className="text-muted-foreground mt-0.5">
                  {meta.join(" / ")}
                </div>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {t.content}
            </p>
            {t.quick_replies && t.quick_replies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.quick_replies.map((qr, qrIdx) => (
                  <span
                    key={`${qrIdx}-${qr}`}
                    className="inline-flex items-center rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {qr}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
