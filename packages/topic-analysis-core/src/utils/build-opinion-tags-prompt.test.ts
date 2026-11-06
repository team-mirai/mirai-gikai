import { describe, expect, it } from "vitest";
import type { ReextractionMessage } from "../shared/types";
import {
  buildOpinionTagsPrompt,
  findPrecedingQuestion,
  findUserMessageContent,
  type OpinionToTag,
} from "./build-opinion-tags-prompt";

const messages: ReextractionMessage[] = [
  { role: "assistant", content: "デジタル教科書についてどう思いますか？" },
  { role: "user", content: "低学年は紙のほうが良いと思います", id: "u1" },
  { role: "assistant", content: "現場での実感はありますか？" },
  { role: "user", content: "小学校教員として板書の効果を感じています", id: "u2" },
  { role: "user", content: "連続した発言です", id: "u3" },
];

const baseOpinion: OpinionToTag = {
  opinion_index: 0,
  title: "低学年は紙の教科書を中心にすべき",
  content: "低学年では紙の教科書のほうが定着すると感じている",
  contextual_quote: "低学年は紙のほうが良いと思います",
  source_message_id: "u1",
};

describe("findPrecedingQuestion", () => {
  it("直前の assistant 発言を返す", () => {
    expect(findPrecedingQuestion(messages, "u2")).toBe(
      "現場での実感はありますか？"
    );
  });

  it("user 発言が連続する場合はさらに前の assistant まで遡る", () => {
    expect(findPrecedingQuestion(messages, "u3")).toBe(
      "現場での実感はありますか？"
    );
  });

  it("source_message_id が null なら null", () => {
    expect(findPrecedingQuestion(messages, null)).toBeNull();
  });

  it("該当する user 発言が無ければ null", () => {
    expect(findPrecedingQuestion(messages, "missing")).toBeNull();
  });

  it("先頭が user 発言で直前に assistant が無ければ null", () => {
    expect(
      findPrecedingQuestion([{ role: "user", content: "冒頭", id: "u0" }], "u0")
    ).toBeNull();
  });

  // レポート提示ターンが除去された結果、無関係な古い質問を拾わないようにする。
  it("遡り上限を超えた assistant 発言は拾わない", () => {
    const farApart: ReextractionMessage[] = [
      { role: "assistant", content: "ずっと前の質問" },
      { role: "user", content: "回答1", id: "u1" },
      { role: "user", content: "回答2", id: "u2" },
      { role: "user", content: "要約後の追記", id: "u3" },
    ];
    expect(findPrecedingQuestion(farApart, "u1")).toBe("ずっと前の質問");
    expect(findPrecedingQuestion(farApart, "u3")).toBeNull();
  });

  it("空文字の assistant 発言は null に正規化する", () => {
    expect(
      findPrecedingQuestion(
        [
          { role: "assistant", content: "   " },
          { role: "user", content: "回答", id: "u9" },
        ],
        "u9"
      )
    ).toBeNull();
  });
});

describe("findUserMessageContent", () => {
  it("指定 id の user 発言本文を返す", () => {
    expect(findUserMessageContent(messages, "u2")).toBe(
      "小学校教員として板書の効果を感じています"
    );
  });

  it("assistant の id では解決しない", () => {
    expect(findUserMessageContent(messages, null)).toBeNull();
    expect(findUserMessageContent(messages, "missing")).toBeNull();
  });
});

describe("buildOpinionTagsPrompt", () => {
  it("意見のタイトル・説明・引用・直前の質問・発言原文を含める", () => {
    const prompt = buildOpinionTagsPrompt({
      billName: "学校教育法等の一部を改正する法律案",
      role: "work_related",
      roleTitle: "小学校教員",
      opinions: [baseOpinion],
      messages,
    });

    expect(prompt).toContain("学校教育法等の一部を改正する法律案");
    expect(prompt).toContain("- role: work_related");
    expect(prompt).toContain("- role_title: 小学校教員");
    expect(prompt).toContain("opinion_index=0");
    expect(prompt).toContain(baseOpinion.title);
    expect(prompt).toContain(baseOpinion.content);
    expect(prompt).toContain("デジタル教科書についてどう思いますか？");
    expect(prompt).toContain("低学年は紙のほうが良いと思います");
  });

  it("件数を明示する", () => {
    const prompt = buildOpinionTagsPrompt({
      billName: "議案",
      role: null,
      roleTitle: null,
      opinions: [baseOpinion, { ...baseOpinion, opinion_index: 1 }],
      messages,
    });
    expect(prompt).toContain("タグ付けする意見（2件）");
    expect(prompt).toContain("opinion_index=1");
  });

  it("role が未設定なら立場ブロックを出さない", () => {
    const prompt = buildOpinionTagsPrompt({
      billName: "議案",
      role: null,
      roleTitle: null,
      opinions: [baseOpinion],
      messages,
    });
    expect(prompt).not.toContain("回答者の立場");
  });

  it("引用・原文が解決できない意見でも壊れない", () => {
    const prompt = buildOpinionTagsPrompt({
      billName: "議案",
      role: null,
      roleTitle: null,
      opinions: [
        {
          ...baseOpinion,
          contextual_quote: null,
          source_message_id: null,
        },
      ],
      messages,
    });
    expect(prompt).toContain("opinion_index=0");
    expect(prompt).not.toContain("- 引用:");
    expect(prompt).not.toContain("- 発言原文:");
    expect(prompt).not.toContain("- 直前の質問");
  });

  it("professional_expertise を肩書だけで付けないよう指示する", () => {
    const prompt = buildOpinionTagsPrompt({
      billName: "議案",
      role: "subject_expert",
      roleTitle: "研究者",
      opinions: [baseOpinion],
      messages,
    });
    expect(prompt).toContain("肩書だけを理由に付けない");
  });
});
