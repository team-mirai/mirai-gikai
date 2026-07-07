import { NextResponse } from "next/server";
import { completeInterviewSession } from "@/features/interview-session/server/services/complete-interview-session";
import { verifySessionOwnership } from "@/features/interview-session/server/utils/verify-session-ownership";
import {
  isInvalidOptionalBooleanInput,
  parseOptionalBoolean,
} from "@/features/interview-session/shared/utils/optional-boolean";

export async function POST(req: Request) {
  const { sessionId, isPublic, isDataReuseConsented } = await req.json();
  const isPublicByUser = parseOptionalBoolean(isPublic);
  const dataReuseConsented = parseOptionalBoolean(isDataReuseConsented);

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (isInvalidOptionalBooleanInput(isPublic)) {
    return NextResponse.json(
      { error: "Invalid isPublic value" },
      { status: 400 }
    );
  }

  if (isInvalidOptionalBooleanInput(isDataReuseConsented)) {
    return NextResponse.json(
      { error: "Invalid isDataReuseConsented value" },
      { status: 400 }
    );
  }

  const ownershipResult = await verifySessionOwnership(sessionId);
  if (!ownershipResult.authorized) {
    return NextResponse.json({ error: ownershipResult.error }, { status: 403 });
  }

  try {
    const report = await completeInterviewSession({
      sessionId,
      isPublicByUser,
      isDataReuseConsented: dataReuseConsented,
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
