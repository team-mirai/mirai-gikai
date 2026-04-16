import type { AiModel } from "@/lib/ai/models";
import type { PromptKind } from "../constants";
import type {
  JudgeVerdict,
  JudgeVsOriginalVerdict,
  PersonaCharacterSheet,
  SimGeneratedReport,
  SimulatedTurn,
} from "../schemas";

/**
 * 元のインタビューを再構成するためのデータ
 */
export interface OriginalInterviewSnapshot {
  reportId: string;
  sessionId: string;
  configId: string;
  billId: string;
  summary: string | null;
  stance: "for" | "against" | "neutral" | null;
  role: string | null;
  roleTitle: string | null;
  roleDescription: string | null;
  opinions: Array<{
    title: string;
    content: string;
    source_message_id: string | null;
  }>;
  /** 元の会話。インタビュアー / インタビュイー の text のみに正規化済み */
  conversation: Array<{
    role: "interviewer" | "interviewee";
    content: string;
    /** インタビュアー発話時に提示された選択肢（quick_replies）。なければ null */
    quick_replies?: string[] | null;
  }>;
  totalContentRichness: number | null;
  rating: number | null;
}

/**
 * シミュレーション 1 本の結果
 */
export interface SimulationRun {
  promptKind: PromptKind;
  /** 実行に用いたインタビュアー側 system prompt（A案: 全文をそのまま編集可能） */
  interviewerSystemPrompt: string;
  /** インタビュアーモデル */
  interviewerModel: AiModel;
  /** インタビュイーモデル */
  intervieweeModel: AiModel;
  transcript: SimulatedTurn[];
  metrics: SimulationMetrics;
  stopReason:
    | "max_turns"
    | "summary"
    | "summary_complete"
    | "interviewer_error"
    | "interviewee_error";
  /** 経過時間 */
  elapsedMs: number;
  /**
   * Summary フェーズで生成されたレポート。
   * 本番プロンプト側で next_stage が summary / summary_complete に遷移した場合のみ生成される。
   * max_turns 到達や、遷移しなかった場合は null。
   */
  generatedReport: SimGeneratedReport | null;
}

/**
 * 会話に対する集計メトリクス
 */
export interface SimulationMetrics {
  totalTurns: number;
  interviewerTurns: number;
  intervieweeTurns: number;
  /** 15 文字以下のインタビュイー回答数 */
  shortAnswerCount: number;
  /** インタビュアーが asked した事前定義質問 ID の重複なし集合 */
  askedQuestionIds: string[];
  /** 事前定義質問のカバレッジ（asked / total） */
  questionCoverage: number;
  /** インタビュアーの平均文字数 */
  avgInterviewerChars: number;
  /** インタビュイーの平均文字数 */
  avgIntervieweeChars: number;
}

/**
 * Server Action / API Route の戻り値
 */
export interface SimulationResult {
  persona: PersonaCharacterSheet;
  personaModel: AiModel;
  judgeModel: AiModel | null;
  original: OriginalInterviewSnapshot;
  simulations: Partial<Record<PromptKind, SimulationRun>>;
  /** evaluate=true のときのみ、現行 vs 改善版の Judge 結果が入る（includeCurrent=true 時のみ） */
  evaluations: Partial<Record<PromptKind, JudgeVerdict | null>>;
  /**
   * evaluate=true のときのみ、改善版 sim と元の実インタビューを比較した Judge 結果
   * （改善版のインタビュアー質問が元と比べて良いか・悪いか・変わらないかを要約）
   */
  evaluationVsOriginal: JudgeVsOriginalVerdict | null;
  totalElapsedMs: number;
}
