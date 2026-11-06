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

type MockStep = {
  /** ステップで返すテキスト */
  text?: string;
  /** ステップで呼び出すツール名 */
  toolCalls?: string[];
};

/**
 * 複数ステップ（ツール呼び出し → テキスト応答など）を返す streamText() 用の
 * MockLanguageModelV3 を作成する。呼び出し毎に steps を先頭から順に返す。
 * NOTE: MockLanguageModelV3 の配列指定は呼び出し順とずれるため関数で返す
 */
export function createMultiStepStreamMock(
  steps: MockStep[]
): MockLanguageModelV3 {
  let stepIndex = 0;
  return new MockLanguageModelV3({
    doStream: async () => {
      const currentStep = stepIndex++;
      const { text, toolCalls = [] } = steps[currentStep] ?? {};
      const streamParts = [
        { type: "stream-start" as const, warnings: [] as [] },
        ...(text
          ? [
              { type: "text-start" as const, id: "text-1" },
              { type: "text-delta" as const, id: "text-1", delta: text },
              { type: "text-end" as const, id: "text-1" },
            ]
          : []),
        ...toolCalls.map((toolName, i) => ({
          type: "tool-call" as const,
          toolCallId: `call-${currentStep}-${i}`,
          toolName,
          input: "{}",
        })),
        {
          type: "finish" as const,
          usage: MOCK_USAGE,
          finishReason: {
            unified:
              toolCalls.length > 0
                ? ("tool-calls" as const)
                : ("stop" as const),
            raw: undefined,
          },
        },
      ];
      return { stream: convertArrayToReadableStream(streamParts) };
    },
  });
}
