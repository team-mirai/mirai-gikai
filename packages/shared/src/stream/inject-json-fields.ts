/**
 * JSONストリームに追加フィールドを注入するTransformStreamを作成
 *
 * LLMが生成するJSONオブジェクトの最後の閉じ括弧の前に
 * 追加のフィールドを挿入する
 *
 * @example
 * ```ts
 * const transformedStream = injectJsonFields(textStream, {
 *   next_stage: "summary",
 *   timestamp: Date.now(),
 * });
 * ```
 */
export function injectJsonFields(
  textStream: ReadableStream<string>,
  fields: Record<string, unknown>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  // 末尾の数文字をバッファリングして、最後の閉じ括弧を検出
  let tail = "";
  const TAIL_SIZE = 64;

  // 注入するJSONフィールドを構築
  const fieldEntries = Object.entries(fields);
  const injection =
    fieldEntries.length > 0
      ? "," +
        fieldEntries
          .map(([key, value]) => `${JSON.stringify(key)}:${JSON.stringify(value)}`)
          .join(",")
      : "";

  const transformer = new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      const combined = tail + chunk;
      if (combined.length > TAIL_SIZE) {
        const toOutput = combined.slice(0, -TAIL_SIZE);
        tail = combined.slice(-TAIL_SIZE);
        controller.enqueue(encoder.encode(toOutput));
      } else {
        tail = combined;
      }
    },

    flush(controller) {
      // 末尾の閉じ括弧を探してフィールドを注入
      const lastBrace = tail.lastIndexOf("}");
      if (lastBrace !== -1 && injection) {
        const before = tail.slice(0, lastBrace);
        const after = tail.slice(lastBrace + 1);
        controller.enqueue(encoder.encode(`${before}${injection}}${after}`));
      } else {
        if (injection) {
          console.warn(
            "[injectJsonFields] No closing brace found in stream tail; fields were not injected."
          );
        }
        controller.enqueue(encoder.encode(tail));
      }
    },
  });

  return textStream.pipeThrough(transformer);
}
