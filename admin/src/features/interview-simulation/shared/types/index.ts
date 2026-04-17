import type { AiModel } from "@/lib/ai/models";
import type { PromptKind } from "../constants";
import type {
  IntervieweeSatisfaction,
  OverallEvaluation,
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

// ============================================================================
// 複数ペルソナ並列シミュレーション
// ============================================================================

/**
 * 複数ペルソナシミュ API のリクエスト内で、各スロットを表す型。
 */
export type PersonaSlotInput =
  | { kind: "report"; reportId: string }
  | {
      kind: "bill";
      /** 立場ヒント（指定しなければ LLM が決める） */
      stanceHint?: "for" | "against" | "neutral";
      /** 役割ヒント（例: "射場運用の民間事業者"） */
      roleHint?: string;
    };

/**
 * 複数ペルソナシミュ API (/api/interview-simulation/run-multi) のリクエストボディ
 */
export interface MultiSimulationRunRequest {
  /** 対象法案 ID（全スロット共通） */
  billId: string;
  /** 各スロットのペルソナ定義（1〜MAX_PERSONA_SLOTS） */
  personaSlots: PersonaSlotInput[];
  /** 改善版 = 編集中 config スナップショット（全スロット共通） */
  improvedConfig: TransientConfigSnapshot;
  interviewerModel: AiModel;
  intervieweeModel: AiModel;
  personaModel: AiModel;
}

/**
 * 1 スロット分のシミュレーション結果
 */
export interface PersonaSimulationResult {
  personaIndex: number;
  personaSource: PersonaSlotInput;
  persona: PersonaCharacterSheet;
  personaModel: AiModel;
  /** report ソースのスロットのみ。bill ソースでは null */
  original: OriginalInterviewSnapshot | null;
  run: SimulationRun;
  elapsedMs: number;
  /** エラー時は error 文字列のみを持ち、他フィールドは空扱い */
  error: string | null;
  /** 満足度評価。LLM 失敗時などは null */
  satisfaction: IntervieweeSatisfaction | null;
}

/**
 * 複数ペルソナシミュ API の戻り値
 */
export interface MultiSimulationResult {
  /** 完了したスロット（エラーのものは含まれない。エラーはストリーミング時のみ見える） */
  slots: PersonaSimulationResult[];
  /** 全ペルソナを横断して LLM がまとめたインタビュー設定の総合評価。失敗時は null */
  overallEvaluation: OverallEvaluation | null;
  totalElapsedMs: number;
}

/**
 * スロット記述子（plan イベントで UI に渡して、プレースホルダを描画するのに使う）
 */
export interface PersonaSlotDescriptor {
  personaIndex: number;
  source: PersonaSlotInput;
  /** UI 表示用ラベル（例: "完了レポート: 物流業者（賛成）", "自動生成: 中立"） */
  label: string;
}

/**
 * 複数ペルソナシミュ用のストリーミング進捗イベント（NDJSON で 1 行ずつ送信）
 */
export type MultiSimulationProgressEvent =
  // グローバル（全スロット共通）
  | { type: "plan"; personaSlots: PersonaSlotDescriptor[] }
  | { type: "global_status"; message: string }
  // スロット単位の進捗
  | { type: "persona_started"; personaIndex: number }
  | { type: "persona_status"; personaIndex: number; message: string }
  | {
      type: "turn";
      personaIndex: number;
      turnIndex: number;
      turn: SimulatedTurn;
    }
  | {
      type: "persona_complete";
      personaIndex: number;
      result: PersonaSimulationResult;
    }
  | { type: "persona_error"; personaIndex: number; message: string }
  // 全スロット完了後、総合評価の LLM が走る段階で配信
  | { type: "overall_evaluation_started" }
  | { type: "overall_evaluation_complete"; evaluation: OverallEvaluation }
  /** LLM 失敗などで総合評価が得られなかったケース。UI の「実行中」を解除するため必ず配信する */
  | { type: "overall_evaluation_failed"; message: string }
  // 全体完了
  | { type: "all_complete"; totalElapsedMs: number };
