import { synthesizeToBuffer } from "@/features/voice-interview/server/services/edge-tts-client";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 2000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { text, rate } = body as { text?: string; rate?: string };

  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Missing text field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(
      JSON.stringify({
        error: `Text exceeds max length of ${MAX_TEXT_LENGTH} characters`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const MAX_RETRIES = 2;
  let lastError: unknown;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const attemptStart = Date.now();
    try {
      const audioBuffer = await synthesizeToBuffer(text, rate);
      const latencyMs = Date.now() - attemptStart;

      console.log(
        JSON.stringify({
          event: "tts_success",
          textLength: text.length,
          rate: rate ?? null,
          attempt: attempt + 1,
          latencyMs,
          audioBytes: audioBuffer.length,
        })
      );

      return new Response(new Uint8Array(audioBuffer), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(audioBuffer.length),
        },
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes("WS error") ||
        msg.includes("timeout") ||
        msg.includes("closed");
      const latencyMs = Date.now() - attemptStart;

      console.log(
        JSON.stringify({
          event: "tts_error",
          textLength: text.length,
          rate: rate ?? null,
          attempt: attempt + 1,
          error: msg,
          isRetryable,
          latencyMs,
        })
      );

      if (isRetryable && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      break;
    }
  }

  const totalLatencyMs = Date.now() - startTime;
  console.log(
    JSON.stringify({
      event: "tts_failed",
      textLength: text.length,
      totalLatencyMs,
    })
  );

  return new Response(
    JSON.stringify({
      error: lastError instanceof Error ? lastError.message : String(lastError),
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
