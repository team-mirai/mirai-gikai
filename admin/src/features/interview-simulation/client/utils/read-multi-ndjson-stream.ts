import type { MultiSimulationProgressEvent } from "../../shared/types";

/**
 * NDJSON ストリームを行単位で分割して MultiSimulationProgressEvent に変換し、
 * onEvent に渡す純粋関数（依存はコールバックのみ）。
 * - 不正な JSON 行は握りつぶしてログのみ（console.warn）
 * - signal.aborted になったら即 return
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

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          onEvent(JSON.parse(line) as MultiSimulationProgressEvent);
        } catch (err) {
          console.warn("[MultiSim] failed to parse NDJSON line:", line, err);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
