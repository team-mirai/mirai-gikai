import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import type { Expert } from "../../shared/types";
import { buildReportsByUserId } from "../../shared/utils/build-reports-by-user-id";
import {
  findCompletedSessionsWithReportsByUserIds,
  findExpertRegistrations,
} from "../repositories/expert-repository";

export async function loadExperts(): Promise<Expert[]> {
  noStore();

  const data = await findExpertRegistrations();
  if (!data || data.length === 0) return [];

  const userIds = data.map((expert) => expert.user_id);
  const sessions = await findCompletedSessionsWithReportsByUserIds(userIds);
  const reportsByUserId = buildReportsByUserId(sessions);

  return data.map((expert) => ({
    id: expert.id,
    name: expert.name,
    email: expert.email,
    affiliation: expert.affiliation,
    created_at: expert.created_at,
    reports: reportsByUserId.get(expert.user_id) ?? [],
  }));
}
