import { NextResponse } from "next/server";
import { getChatSupabaseUser } from "@/features/chat/server/utils/supabase-server";
import { completeInterviewSession } from "@/features/interview-session/server/services/complete-interview-session";

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  const {
    data: { user },
    error: getUserError,
  } = await getChatSupabaseUser();

  if (getUserError || !user) {
    return NextResponse.json(
      { error: "Anonymous session required" },
      { status: 401 }
    );
  }

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const report = await completeInterviewSession({
      sessionId,
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Complete interview error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete interview",
      },
      { status: 500 }
    );
  }
}
