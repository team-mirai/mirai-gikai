"use server";

import { deleteTopic } from "@mirai-gikai/topic-analysis-core/repository";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { routes } from "@/lib/routes";

/** Admin による個別トピック削除（LLM の誤割当トピックを取り除く手動操作）。 */
export async function deleteTopicAction(input: {
  topicId: string;
  versionId: string;
  billId: string;
}): Promise<void> {
  await requireAdmin();
  await deleteTopic(input.topicId, input.versionId);
  revalidatePath(routes.billUserTopicAnalysis(input.billId));
}
