import type { MultiSimulationProgressEvent } from "../../shared/types";

function tryEmit(
  line: string,
  onEvent: (event: MultiSimulationProgressEvent) => void
) {
  if (!line.trim()) return;
  try {
    onEvent(JSON.parse(line) as MultiSimulationProgressEvent);
  } catch (err) {
    // 不正 JSON 行はスキップしてストリーム継続（サーバーの部分出力混入等）
    console.warn("[MultiSim] failed to parse NDJSON line:", line, err);
  }
}

/**
 * NDJSON ストリームを行単位で分割して MultiSimulationProgressEvent に変換し、
 * onEvent に渡す。
 *
 * - signal.abort 時に reader.cancel() を呼び、ブロッキング中の read() を
 *   即座に解除する（次チャンク到着を待たずに抜ける）
 * - 末尾に改行で終わらない行が残った場合もストリーム終了時に flush する
 *   （all_complete 等の最後のイベントが \n なしで来ても拾えるように）
 * - 不正 JSON 行はログ出力のみでスキップし、ストリーム全体は落とさない
 */
export async function readMultiNdjsonStream(
  response: Response,
  onEvent: (event: MultiSimulationProgressEvent) => void,
  signal: AbortSignal
): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // 外部 abort で reader をキャンセル（reader.read() がブロック中でも即解除）
  const onAbort = () => {
    reader.cancel().catch(() => {
      // reader が既にクローズ済み等は無視
    });
  };
  if (signal.aborted) {
    onAbort();
  } else {
    signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        tryEmit(line, onEvent);
      }
    }

    // ストリーム末尾で decoder の内部バッファも flush し、
    // 残存 buffer に最終行がある場合は拾う（\n 無し終端の取りこぼし防止）
    buffer += decoder.decode();
    if (!signal.aborted && buffer.length > 0) {
      tryEmit(buffer, onEvent);
    }
  } finally {
    signal.removeEventListener("abort", onAbort);
    reader.releaseLock();
  }
}
