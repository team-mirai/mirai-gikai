import "server-only";

import type { InterviewStatistics } from "../../shared/types";
import { mapInterviewStatistics } from "../../shared/utils/map-interview-statistics";
import {
  findInterviewConfigIdByBillId,
  findInterviewStatistics,
} from "../repositories/interview-report-repository";

export async function getInterviewStatistics(
  billId: string
): Promise<InterviewStatistics | null> {
  const config = await findInterviewConfigIdByBillId(billId);

  if (!config) {
    return null;
  }

  try {
    const raw = await findInterviewStatistics(config.id);
    if (!raw) {
      return null;
    }
    return mapInterviewStatistics(raw);
  } catch (error) {
    console.error("Failed to fetch interview statistics:", error);
    return null;
  }
}
