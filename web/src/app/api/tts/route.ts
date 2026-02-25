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

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[EdgeTTS] Synthesizing (attempt ${attempt + 1}): "${text.substring(0, 50)}..."${rate ? ` rate=${rate}` : ""}`
      );
      const audioBuffer = await synthesizeToBuffer(text, rate);
      console.log("[EdgeTTS] Done");

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
      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(
          `[EdgeTTS] Retrying (${attempt + 1}/${MAX_RETRIES}): ${msg}`
        );
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      break;
    }
  }

  console.error("[EdgeTTS] Error:", lastError);
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
