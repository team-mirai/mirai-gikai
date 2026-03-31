import "server-only";

import type { InterviewStatistics } from "../../shared/types";
import { mapInterviewStatistics } from "../../shared/utils/map-interview-statistics";
import { findInterviewStatistics } from "../repositories/interview-report-repository";

export async function getInterviewStatistics(
  configId: string
): Promise<InterviewStatistics | null> {
  try {
    const raw = await findInterviewStatistics(configId);
    if (!raw) {
      return null;
    }
    return mapInterviewStatistics(raw);
  } catch (error) {
    console.error("Failed to fetch interview statistics:", error);
    return null;
  }
}
