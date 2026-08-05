import {
  buildUntrustedContentGuardInstructions,
  createUntrustedContentNonce,
  type SplitPrompt,
  wrapUntrustedContent,
} from "../prompt-safety/untrusted-content";
import { buildContentRichnessInstructions } from "./content-richness-instructions";

type Message = {
  role: string;
  content: string;
};

type BuildContentRichnessPromptParams = {
  summary: string | null;
  opinions: Array<{ title: string; content: string }> | null;
  roleDescription: string | null;
  messages: Message[];
  /**
   * 区切り行に使うナンス。省略時は呼び出しごとにランダム生成する
   * （テストで固定するための注入点）
   */
  nonce?: string;
};

/**
 * 情報充実度の再評価用プロンプトを構築する
 *
 * 評価基準（指示チャネル）は system に、利用者が書いた評価対象テキスト
 * （データチャネル）は user に分離して返す。
 */
export function buildContentRichnessPrompt(
  params: BuildContentRichnessPromptParams
): SplitPrompt {
  const nonce = params.nonce ?? createUntrustedContentNonce();
  const parts: string[] = [];

  if (params.messages.length > 0) {
    const messagesText = params.messages
      .map((m) => `[${m.role}] ${m.content}`)
      .join("\n");
    parts.push(`## 会話ログ\n${messagesText}`);
  }

  if (params.summary) {
    parts.push(`## レポート要約\n${params.summary}`);
  }

  if (params.opinions && params.opinions.length > 0) {
    const opinionsText = params.opinions
      .map((o, i) => `${i + 1}. ${o.title}\n   ${o.content}`)
      .join("\n");
    parts.push(`## 意見\n${opinionsText}`);
  }

  if (params.roleDescription) {
    parts.push(`## 回答者の背景\n${params.roleDescription}`);
  }

  const contentToEvaluate =
    parts.length > 0 ? parts.join("\n\n") : "（内容なし）";

  const system = `あなたはAIインタビューで収集された市民意見の情報充実度を評価する専門家です。

user メッセージで渡されるインタビューの会話ログおよびレポート内容を評価し、法案検討にどれだけ活かせる情報が得られたかを判定してください。

${buildUntrustedContentGuardInstructions(nonce)}

${buildContentRichnessInstructions()}`;

  return {
    system,
    user: wrapUntrustedContent(contentToEvaluate, nonce),
  };
}
