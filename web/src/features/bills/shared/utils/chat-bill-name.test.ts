import { describe, expect, it } from "vitest";
import { chatBillName } from "./chat-bill-name";

const bill = (name: string, title?: string) =>
  ({
    name,
    bill_content: title === undefined ? undefined : ({ title } as never),
  }) as Parameters<typeof chatBillName>[0];

describe("chatBillName", () => {
  it("タイトルと正式名称を併記する", () => {
    expect(chatBillName(bill("揮発油税等の…法律案", "ガソリン税の法案"))).toBe(
      "ガソリン税の法案（揮発油税等の…法律案）"
    );
  });

  // テンプレート文字列に直接埋めると "undefined（…）" が LLM の文脈に入る。
  it("bill_content が無ければ正式名称だけにする", () => {
    expect(chatBillName(bill("揮発油税等の…法律案"))).toBe(
      "揮発油税等の…法律案"
    );
  });

  it("タイトルが空文字なら正式名称だけにする", () => {
    expect(chatBillName(bill("揮発油税等の…法律案", ""))).toBe(
      "揮発油税等の…法律案"
    );
  });
});
