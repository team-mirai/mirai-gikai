import type { AiModel } from "@/lib/ai/models";
import type { PromptKind } from "../constants";
import type {
  JudgeVsOriginalVerdict,
  PersonaCharacterSheet,
  SimGeneratedReport,
  SimulatedTurn,
} from "../schemas";

/**
 * シミュレーション画面の Select で表示する完了レポート行。
 * server/loaders/get-completed-reports-for-bill が返す形と対応。
 * client component から server 型を直接参照しないよう shared に置く。
 */
export interface CompletedReportListItem {
  sessionId: string;
  reportId: string;
  /** このレポートが属する config ID。UI で「現在の config のみ」フィルタに使う */
  configId: string;
  /** config 名。法案全体から選ぶとき、どの config のインタビューか判別する */
  configName: string | null;
  roleTitle: string | null;
  role: string | null;
  stance: string | null;
  summary: string | null;
  totalContentRichness: number | null;
  completedAt: string | null;
}

/**
 * ストリーミング進捗イベント（NDJSON で 1 行ずつ送信される）
 */
export type SimulationProgressEvent =
  | { type: "status"; message: string }
  | { type: "turn"; turnIndex: number; turn: SimulatedTurn }
  | { type: "complete"; result: SimulationResult }
  | { type: "error"; message: string };

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
 * UI フォームから送る「編集中（未保存を含む）の config スナップショット」。
 * 改善版 sim はこの値を使って system prompt を毎ターン構築する。
 * 本番の「編集した config を保存せずにテストする」ユースケース向け。
 */
export interface TransientConfigSnapshot {
  mode: "loop" | "bulk";
  themes: string[] | null;
  knowledgeSource: string | null;
  /** インタビュー目安時間（分）。本番の「## タイムマネジメント」セクションに反映される */
  estimatedDurationMinutes: number | null;
  questions: Array<{
    /** 既存質問ならその id、未保存の新規質問ならクライアント側の一時 UUID */
    id: string;
    question: string;
    quick_replies: string[] | null;
    follow_up_guide: string | null;
  }>;
}

/**
 * ペルソナ生成のソース指定
 * - report: 過去の完了インタビューから抽出
 * - bill: 法案内容のみから LLM で自動生成（レポートがない段階でも使える）
 */
export type PersonaSource =
  | { type: "report"; reportId: string }
  | {
      type: "bill";
      /** 対象法案 ID（改善版 config の bill_id） */
      billId: string;
      /** 生成ペルソナの立場ヒント。指定しなければ LLM が法案内容から決める */
      stanceHint?: "for" | "against" | "neutral";
      /** 立場・属性の自由記述ヒント。例: "教育現場の教員" */
      roleHint?: string;
    };

/**
 * シミュレーション API (/api/interview-simulation/run) のリクエストボディ
 */
export interface SimulationRunRequest {
  /** ペルソナ抽出のソース（過去レポート or 法案から自動生成） */
  personaSource: PersonaSource;
  /** 改善版 = UI で編集中の config スナップショット（未保存を含む） */
  improvedConfig: TransientConfigSnapshot;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
  judgeModel: AiModel;
  /** false なら improved だけ実行。true なら「保存済み config」と並列 sim + Judge で比較（bill モードでは無視） */
  includeCurrent: boolean;
  /** false なら Judge を回さない（bill モードでは無視＝常に false 扱い） */
  evaluate: boolean;
}

/**
 * API Route の戻り値
 */
export interface SimulationResult {
  persona: PersonaCharacterSheet;
  personaModel: AiModel;
  judgeModel: AiModel | null;
  /** 元レポート（report モード時のみ）。bill モードでは null */
  original: OriginalInterviewSnapshot | null;
  simulations: Partial<Record<PromptKind, SimulationRun>>;
  /**
   * evaluate=true かつ report モードのときのみ、改善版 sim と元の実インタビューを比較した Judge 結果
   * （改善版のインタビュアー質問が元と比べて良いか・悪いか・変わらないかを要約）
   */
  evaluationVsOriginal: JudgeVsOriginalVerdict | null;
  totalElapsedMs: number;
}
