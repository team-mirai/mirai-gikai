"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";
import { setVersionPublished } from "../repositories/user-topic-analysis-repository";

/** Admin による version の公開／非公開切替（§7）。 */
export async function setVersionPublishedAction(input: {
  versionId: string;
  billId: string;
  published: boolean;
}): Promise<void> {
  await requireAdmin();
  await setVersionPublished(input.versionId, input.published);
  revalidatePath(routes.billUserTopicAnalysis(input.billId));
}
