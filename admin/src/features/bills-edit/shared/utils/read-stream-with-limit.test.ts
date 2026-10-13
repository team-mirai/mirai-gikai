import { describe, expect, it } from "vitest";
import { readStreamWithLimit } from "./read-stream-with-limit";

function streamOf(chunks: number[][]) {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
      controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });
  return { stream, isCancelled: () => cancelled };
}

describe("readStreamWithLimit", () => {
  it("上限以内なら全チャンクを連結して返す", async () => {
    const { stream } = streamOf([[1, 2], [3], [4, 5]]);
    expect(await readStreamWithLimit(stream, 5)).toEqual(
      new Uint8Array([1, 2, 3, 4, 5])
    );
  });

  it("上限を超えたら読み込みを打ち切って null を返す", async () => {
    const { stream, isCancelled } = streamOf([[1, 2], [3, 4], [5]]);
    expect(await readStreamWithLimit(stream, 3)).toBeNull();
    expect(isCancelled()).toBe(true);
  });
});
