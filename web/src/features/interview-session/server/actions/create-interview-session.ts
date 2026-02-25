"use server";

import type { InterviewSession } from "../../shared/types";
import { createInterviewSessionCore } from "../services/create-interview-session-core";

export async function createInterviewSession({
  interviewConfigId,
}: {
  interviewConfigId: string;
}): Promise<InterviewSession> {
  return createInterviewSessionCore({ interviewConfigId });
}
