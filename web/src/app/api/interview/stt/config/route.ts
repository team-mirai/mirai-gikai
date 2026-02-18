import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";

export async function GET() {
  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = process.env.STT_PROVIDER ?? "openai";

  return Response.json({ provider });
}
