import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

export async function POST() {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "STT is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-transcribe",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Realtime session error:", errorText);
      return Response.json(
        { error: "Failed to create STT session" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return Response.json({
      client_secret: data.client_secret,
    });
  } catch (error) {
    console.error("STT session request error:", error);
    return Response.json(
      { error: "STT session request failed" },
      { status: 500 }
    );
  }
}
