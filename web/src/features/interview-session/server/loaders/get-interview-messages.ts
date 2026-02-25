import "server-only";

import type { InterviewMessage } from "../../shared/types";
import { findInterviewMessagesBySessionId } from "../repositories/interview-session-repository";
import {
  verifySessionOwnership,
  type LoaderDeps,
} from "../utils/verify-session-ownership";

export async function getInterviewMessages(
  sessionId: string,
  deps?: LoaderDeps
): Promise<InterviewMessage[]> {
  const ownershipResult = await verifySessionOwnership(sessionId, deps);

  if (!ownershipResult.authorized) {
    console.error(
      "Unauthorized access to interview messages:",
      ownershipResult.error
    );
    return [];
  }

  try {
    return await findInterviewMessagesBySessionId(sessionId);
  } catch (error) {
    console.error("Failed to fetch interview messages:", error);
    return [];
  }
}
