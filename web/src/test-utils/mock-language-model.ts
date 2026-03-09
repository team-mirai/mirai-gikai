import { MockLanguageModelV3, convertArrayToReadableStream } from "ai/test";

const MOCK_FINISH_REASON = {
  unified: "stop" as const,
  raw: undefined as string | undefined,
};

const MOCK_USAGE = {
  inputTokens: {
    total: 0 as number | undefined,
    noCache: 0 as number | undefined,
    cacheRead: 0 as number | undefined,
    cacheWrite: 0 as number | undefined,
  },
  outputTokens: {
    total: 0 as number | undefined,
    text: 0 as number | undefined,
    reasoning: 0 as number | undefined,
  },
};

/**
 * generateText() 用の MockLanguageModelV3 を作成する。
 * @param text - モデルが返すテキスト（JSON文字列など）
 */
export function createGenerateMock(text: string): MockLanguageModelV3 {
  return new MockLanguageModelV3({
    doGenerate: {
      content: [{ type: "text" as const, text }],
      finishReason: MOCK_FINISH_REASON,
      usage: MOCK_USAGE,
      warnings: [],
    },
  });
}

/**
 * streamText() 用の MockLanguageModelV3 を作成する。
 * @param textChunks - ストリームで返すテキストチャンクの配列
 */
export function createStreamMock(textChunks: string[]): MockLanguageModelV3 {
  const streamParts = [
    { type: "stream-start" as const, warnings: [] as [] },
    { type: "text-start" as const, id: "text-1" },
    ...textChunks.map((delta) => ({
      type: "text-delta" as const,
      id: "text-1",
      delta,
    })),
    { type: "text-end" as const, id: "text-1" },
    {
      type: "finish" as const,
      usage: MOCK_USAGE,
      finishReason: MOCK_FINISH_REASON,
    },
  ];

  return new MockLanguageModelV3({
    doStream: {
      stream: convertArrayToReadableStream(streamParts),
    },
  });
}
