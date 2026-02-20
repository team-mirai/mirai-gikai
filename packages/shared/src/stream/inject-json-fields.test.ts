import { describe, expect, it } from "vitest";
import { injectJsonFields } from "./inject-json-fields";

/**
 * ReadableStreamを作成するヘルパー
 */
function createStream(chunks: string[]): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

/**
 * ReadableStream<Uint8Array>を文字列に変換するヘルパー
 */
async function streamToString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

describe("injectJsonFields", () => {
  it("単一フィールドを注入できる", async () => {
    const input = '{"text":"hello","count":1}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, { next_stage: "summary" })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      count: 1,
      next_stage: "summary",
    });
  });

  it("複数フィールドを注入できる", async () => {
    const input = '{"text":"hello"}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, {
        next_stage: "chat",
        timestamp: 12345,
      })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      next_stage: "chat",
      timestamp: 12345,
    });
  });

  it("ネストしたオブジェクトを注入できる", async () => {
    const input = '{"text":"hello"}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, {
        metadata: { source: "llm", version: 1 },
      })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      metadata: { source: "llm", version: 1 },
    });
  });

  it("空のフィールドオブジェクトでは何も注入しない", async () => {
    const input = '{"text":"hello"}';
    const stream = createStream([input]);

    const result = await streamToString(injectJsonFields(stream, {}));

    expect(JSON.parse(result)).toEqual({
      text: "hello",
    });
  });

  it("複数チャンクに分割されたストリームを処理できる", async () => {
    // LLMのストリーミング出力をシミュレート
    const chunks = ['{"te', 'xt":"h', 'ello","co', 'unt":1}'];
    const stream = createStream(chunks);

    const result = await streamToString(
      injectJsonFields(stream, { next_stage: "summary" })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      count: 1,
      next_stage: "summary",
    });
  });

  it("ネストしたJSONオブジェクトの最後の閉じ括弧の前に注入する", async () => {
    const input = '{"text":"hello","report":{"summary":"test"}}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, { next_stage: "summary" })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      report: { summary: "test" },
      next_stage: "summary",
    });
  });

  it("文字列値に閉じ括弧が含まれていても正しく処理できる", async () => {
    const input = '{"text":"hello}world"}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, { added: true })
    );

    // 最後の } の前に注入されるので、文字列内の } は無視される
    expect(JSON.parse(result)).toEqual({
      text: "hello}world",
      added: true,
    });
  });

  it("配列を値として注入できる", async () => {
    const input = '{"text":"hello"}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, {
        tags: ["a", "b", "c"],
      })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      tags: ["a", "b", "c"],
    });
  });

  it("null値を注入できる", async () => {
    const input = '{"text":"hello"}';
    const stream = createStream([input]);

    const result = await streamToString(
      injectJsonFields(stream, { nullable_field: null })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hello",
      nullable_field: null,
    });
  });

  it("1文字ずつストリームされても正しく処理できる", async () => {
    const input = '{"text":"hi"}';
    const chunks = input.split("");
    const stream = createStream(chunks);

    const result = await streamToString(
      injectJsonFields(stream, { added: true })
    );

    expect(JSON.parse(result)).toEqual({
      text: "hi",
      added: true,
    });
  });
});
