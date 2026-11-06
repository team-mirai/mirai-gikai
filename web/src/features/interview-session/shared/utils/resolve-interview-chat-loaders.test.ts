import { describe, expect, it } from "vitest";
import {
  type InterviewChatLoaders,
  resolveInterviewChatLoaders,
} from "./resolve-interview-chat-loaders";

const adminLoaders: InterviewChatLoaders<string, string> = {
  getInterviewConfig: async () => "admin-config",
  getBill: async () => "admin-bill",
};

const publicLoaders: InterviewChatLoaders<string, string> = {
  getInterviewConfig: async () => "public-config",
  getBill: async () => "public-bill",
};

/** 呼び出し引数を記録する検証関数のフェイク */
function createValidator(result: boolean) {
  const calls: Array<{ billId: string; token: string }> = [];
  return {
    calls,
    validate: async (billId: string, token: string) => {
      calls.push({ billId, token });
      return result;
    },
  };
}

describe("resolveInterviewChatLoaders", () => {
  it("有効なプレビュートークンの場合は管理者用ローダーを返す", async () => {
    const { validate, calls } = createValidator(true);

    const loaders = await resolveInterviewChatLoaders({
      billId: "bill-1",
      previewToken: "valid-token",
      validate,
      adminLoaders,
      publicLoaders,
    });

    expect(await loaders.getInterviewConfig("bill-1")).toBe("admin-config");
    expect(await loaders.getBill("bill-1")).toBe("admin-bill");
    expect(calls).toEqual([{ billId: "bill-1", token: "valid-token" }]);
  });

  it("無効なプレビュートークンの場合は公開ローダーを返す", async () => {
    const { validate, calls } = createValidator(false);

    const loaders = await resolveInterviewChatLoaders({
      billId: "bill-1",
      previewToken: "invalid-token",
      validate,
      adminLoaders,
      publicLoaders,
    });

    expect(await loaders.getInterviewConfig("bill-1")).toBe("public-config");
    expect(await loaders.getBill("bill-1")).toBe("public-bill");
    expect(calls).toEqual([{ billId: "bill-1", token: "invalid-token" }]);
  });

  it("プレビュートークン未指定の場合は検証せずに公開ローダーを返す", async () => {
    const { validate, calls } = createValidator(true);

    const loaders = await resolveInterviewChatLoaders({
      billId: "bill-1",
      previewToken: undefined,
      validate,
      adminLoaders,
      publicLoaders,
    });

    expect(await loaders.getInterviewConfig("bill-1")).toBe("public-config");
    expect(await loaders.getBill("bill-1")).toBe("public-bill");
    expect(calls).toEqual([]);
  });

  it("空文字のプレビュートークンは検証せずに公開ローダーを返す", async () => {
    const { validate, calls } = createValidator(true);

    const loaders = await resolveInterviewChatLoaders({
      billId: "bill-1",
      previewToken: "",
      validate,
      adminLoaders,
      publicLoaders,
    });

    expect(await loaders.getInterviewConfig("bill-1")).toBe("public-config");
    expect(calls).toEqual([]);
  });
});
