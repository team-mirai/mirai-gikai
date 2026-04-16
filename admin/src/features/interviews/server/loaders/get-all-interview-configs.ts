import "server-only";

import {
  findAllInterviewConfigs,
  type InterviewConfigWithBill,
} from "@/features/interview-config/server/repositories/interview-config-repository";
import { countAllSessionsByConfigId } from "@/features/interview-config/server/repositories/interview-config-repository";

export async function getAllInterviewConfigs(): Promise<
  InterviewConfigWithBill[]
> {
  try {
    return await findAllInterviewConfigs();
  } catch (error) {
    console.error("Failed to fetch all interview configs:", error);
    return [];
  }
}

export async function getAllSessionCounts(): Promise<Record<
  string,
  number
> | null> {
  try {
    return await countAllSessionsByConfigId();
  } catch (error) {
    console.error("Failed to fetch session counts:", error);
    return null;
  }
}
