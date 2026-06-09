import { executeAssign } from "@/features/user-topic-analysis/server/services/orchestrator";
import { handleStepRoute } from "@/features/user-topic-analysis/server/utils/handle-step-route";

export const maxDuration = 300;

export async function POST(request: Request) {
  return handleStepRoute(request, "assign", async (versionId) => {
    await executeAssign(versionId);
  });
}
