import { describe, expect, it } from "vitest";
import {
  buildMessagesForApi,
  buildMessagesForFacilitator,
  convertPartialReport,
} from "./message-utils";

describe("convertPartialReport", () => {
  it("nullならnullを返す", () => {
    expect(convertPartialReport(null)).toBeNull();
  });

  it("undefinedならnullを返す", () => {
    expect(convertPartialReport(undefined)).toBeNull();
  });

  it("有効なレポートを変換する", () => {
    const result = convertPartialReport({
      summary: "テスト要約",
      stance: "for",
      role: "general_citizen",
      role_description: "一般市民",
      role_title: "市民",
      opinions: [{ title: "意見1", content: "内容1" }],
    });
    expect(result).toEqual({
      summary: "テスト要約",
      stance: "for",
      role: "general_citizen",
      role_description: "一般市民",
      role_title: "市民",
      opinions: [{ title: "意見1", content: "内容1" }],
    });
  });

  it("全フィールドがnull/空なら無効としてnullを返す", () => {
    const result = convertPartialReport({
      summary: null,
      stance: null,
      role: null,
      role_description: null,
      role_title: null,
      opinions: [],
    });
    expect(result).toBeNull();
  });

  it("opinionsにnull/undefinedが含まれる場合はフィルタする", () => {
    const result = convertPartialReport({
      summary: "要約あり",
      opinions: [
        { title: "意見1", content: "内容1" },
        undefined,
        null as unknown as undefined,
        { title: "意見2", content: "内容2" },
      ],
    });
    expect(result?.opinions).toEqual([
      { title: "意見1", content: "内容1" },
      { title: "意見2", content: "内容2" },
    ]);
  });

  it("opinionsのtitle/contentがundefinedなら空文字に変換する", () => {
    const result = convertPartialReport({
      summary: "要約",
      opinions: [{ title: undefined, content: undefined }],
    });
    // title も content も空文字 → フィルタされる
    expect(result?.opinions).toEqual([]);
  });

  it("opinionsのtitleだけあればフィルタされない", () => {
    const result = convertPartialReport({
      summary: "要約",
      opinions: [{ title: "タイトルのみ", content: undefined }],
    });
    expect(result?.opinions).toEqual([{ title: "タイトルのみ", content: "" }]);
  });

  it("opinionsがnullなら空配列になる", () => {
    const result = convertPartialReport({
      summary: "要約あり",
      opinions: null,
    });
    expect(result?.opinions).toEqual([]);
  });

  it("未定義フィールドはnullにフォールバックする", () => {
    const result = convertPartialReport({
      summary: "テスト",
    });
    expect(result).toEqual({
      summary: "テスト",
      stance: null,
      role: null,
      role_description: null,
      role_title: null,
      opinions: [],
    });
  });
});

describe("buildMessagesForApi", () => {
  it("initialとconversationを結合する", () => {
    const initial = [{ role: "assistant" as const, content: "初期メッセージ" }];
    const conversation = [
      { role: "user" as const, content: "ユーザー入力" },
      { role: "assistant" as const, content: "応答" },
    ];
    const result = buildMessagesForApi(initial, conversation);
    expect(result).toEqual([
      { role: "assistant", content: "初期メッセージ" },
      { role: "user", content: "ユーザー入力" },
      { role: "assistant", content: "応答" },
    ]);
  });

  it("newUserMessageがあれば末尾に追加する", () => {
    const initial = [{ role: "assistant" as const, content: "初期" }];
    const conversation = [{ role: "user" as const, content: "会話" }];
    const result = buildMessagesForApi(initial, conversation, "新しい入力");
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ role: "user", content: "新しい入力" });
  });

  it("newUserMessageが空文字なら追加しない", () => {
    const result = buildMessagesForApi([], [], "");
    expect(result).toHaveLength(0);
  });

  it("newUserMessageがundefinedなら追加しない", () => {
    const result = buildMessagesForApi([], []);
    expect(result).toHaveLength(0);
  });

  it("両方空配列なら空配列を返す", () => {
    expect(buildMessagesForApi([], [])).toEqual([]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const initial = [{ role: "assistant" as const, content: "初期" }];
    const conversation = [{ role: "user" as const, content: "会話" }];
    const initialCopy = [...initial];
    const conversationCopy = [...conversation];
    buildMessagesForApi(initial, conversation, "追加");
    expect(initial).toEqual(initialCopy);
    expect(conversation).toEqual(conversationCopy);
  });
});

describe("buildMessagesForFacilitator", () => {
  it("initialとconversationとnewUserMessageを結合する", () => {
    const initial = [{ role: "assistant" as const, content: "システム" }];
    const conversation = [
      { role: "user" as const, content: "入力1" },
      { role: "assistant" as const, content: "応答1" },
    ];
    const result = buildMessagesForFacilitator(initial, conversation, {
      content: "新規入力",
    });
    expect(result).toEqual([
      { role: "assistant", content: "システム" },
      { role: "user", content: "入力1" },
      { role: "assistant", content: "応答1" },
      { role: "user", content: "新規入力" },
    ]);
  });

  it("空の初期・会話配列でもnewUserMessageが追加される", () => {
    const result = buildMessagesForFacilitator([], [], {
      content: "最初の入力",
    });
    expect(result).toEqual([{ role: "user", content: "最初の入力" }]);
  });

  it("元の配列を変更しない（イミュータブル）", () => {
    const initial = [{ role: "assistant" as const, content: "初期" }];
    const conversation = [{ role: "user" as const, content: "会話" }];
    const initialCopy = [...initial];
    const conversationCopy = [...conversation];
    buildMessagesForFacilitator(initial, conversation, { content: "入力" });
    expect(initial).toEqual(initialCopy);
    expect(conversation).toEqual(conversationCopy);
  });

  it("結果のroleはassistantまたはuserのみ", () => {
    const result = buildMessagesForFacilitator(
      [{ role: "assistant" as const, content: "a" }],
      [{ role: "user" as const, content: "b" }],
      { content: "c" }
    );
    for (const msg of result) {
      expect(["assistant", "user"]).toContain(msg.role);
    }
  });
});
