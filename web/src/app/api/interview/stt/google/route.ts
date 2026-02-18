import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS;
  if (!credentialsJson) {
    return Response.json(
      { error: "Google Cloud STT is not configured" },
      { status: 500 }
    );
  }

  const language = req.headers.get("X-Language") ?? "ja-JP";

  // Dynamic import to avoid bundling when not used
  const { SpeechClient } = await import("@google-cloud/speech");

  const credentials = JSON.parse(credentialsJson);
  const client = new SpeechClient({ credentials });

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const recognizeStream = client.streamingRecognize({
    config: {
      encoding:
        "LINEAR16" as unknown as number /* protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16 */,
      sampleRateHertz: 16000,
      languageCode: language,
      enableAutomaticPunctuation: true,
      model: "latest_long",
    },
    interimResults: true,
  });

  recognizeStream.on(
    "data",
    (data: {
      results?: Array<{
        alternatives?: Array<{ transcript?: string }>;
        isFinal?: boolean;
      }>;
    }) => {
      const result = data.results?.[0];
      if (!result) return;

      const transcript = result.alternatives?.[0]?.transcript ?? "";
      const isFinal = result.isFinal ?? false;

      const event = JSON.stringify({
        type: isFinal ? "final" : "interim",
        transcript,
        is_final: isFinal,
      });

      writer.write(encoder.encode(`${event}\n`)).catch(() => {});
    }
  );

  recognizeStream.on("error", (err: Error) => {
    const event = JSON.stringify({
      type: "error",
      message: err.message,
    });
    writer.write(encoder.encode(`${event}\n`)).catch(() => {});
    writer.close().catch(() => {});
  });

  recognizeStream.on("end", () => {
    writer.close().catch(() => {});
  });

  // Read incoming audio stream and forward to Google
  const body = req.body;
  if (body) {
    const reader = body.getReader();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          recognizeStream.write(value);
        }
        recognizeStream.end();
      } catch {
        recognizeStream.end();
      }
    })();
  }

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
