import "server-only";
import { unstable_noStore as noStore } from "next/cache";
import type { Expert } from "../../shared/types";
import { findExpertRegistrations } from "../repositories/expert-repository";

export async function loadExperts(): Promise<Expert[]> {
  noStore();

  const data = await findExpertRegistrations();

  return data ?? [];
}
