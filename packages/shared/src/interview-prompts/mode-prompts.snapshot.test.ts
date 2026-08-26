import { describe, expect, it } from "vitest";
import { buildBulkModeSystemPrompt } from "./bulk-mode";
import { buildLoopModeSystemPrompt } from "./loop-mode";
import { buildTargetedModeSystemPrompt } from "./targeted-mode";
import type { InterviewPromptInput } from "./types";

/*
  モード別プロンプトの全文スナップショット。

  プロンプトは節ごとに切り出して差し替え可能にしているため、切り出しの際に
  空白や見出しがずれても気づけるよう、組み上がった全文を固定しておく。
  意図した文言変更のときだけスナップショットを更新する。
*/

const baseInput: InterviewPromptInput = {
  bill: {
    name: "揮発油税等の暫定税率の廃止等に関する法律案",
    knowledge_source: "補足資料",
    bill_content: {
      title: "ガソリン税を安くする法案",
      summary: "ガソリンにかかる税金を下げる法案です。",
      content: "本文",
    },
  },
  interviewConfig: { themes: ["家計への影響", "物流への影響"] },
  questions: [
    {
      id: "q1",
      question: "この法案をご存じでしたか？",
      quick_replies: ["知っていた", "知らなかった"],
      follow_up_guide: "知った経緯を聞く",
    },
    {
      id: "q2",
      question: "生活への影響を教えてください",
      target_audience: "自動車を日常的に使う方",
    },
  ],
  currentStage: "chat",
  askedQuestionIds: new Set<string>(),
  remainingMinutes: 10,
};

describe("モード別システムプロンプト", () => {
  it("ループモードの全文", () => {
    expect(buildLoopModeSystemPrompt(baseInput)).toMatchSnapshot();
  });

  it("一括モードの全文", () => {
    expect(buildBulkModeSystemPrompt(baseInput)).toMatchSnapshot();
  });

  // 次の質問が指定されると、一括モードは短い専用プロンプトに切り替わる。
  it("一括モードの次質問指定時の全文", () => {
    expect(
      buildBulkModeSystemPrompt({ ...baseInput, nextQuestionId: "q1" })
    ).toMatchSnapshot();
  });

  it("対象者指定モードの全文", () => {
    expect(buildTargetedModeSystemPrompt(baseInput)).toMatchSnapshot();
  });
});
