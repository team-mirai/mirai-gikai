import { NextResponse } from "next/server";
import { createInterviewSessionRating } from "@/features/interview-session/server/repositories/interview-session-repository";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";

export async function POST(req: Request) {
  const { sessionId, rating } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a number between 1 and 5" },
      { status: 400 }
    );
  }

  const ownershipResult = await verifySessionOwnership(sessionId);
  if (!ownershipResult.authorized) {
    return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
  }

  try {
    await createInterviewSessionRating({
      sessionId,
      rating: Math.round(rating),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save interview rating error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save rating",
      },
      { status: 500 }
    );
  }
}
