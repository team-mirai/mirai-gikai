import { executeMerge } from "@/features/user-topic-analysis/server/services/orchestrator";
import { handleStepRoute } from "@/features/user-topic-analysis/server/utils/handle-step-route";
import { triggerStep } from "@/features/user-topic-analysis/server/utils/trigger-step";

export const maxDuration = 300;

export async function POST(request: Request) {
  return handleStepRoute(
    request,
    "merge",
    (versionId) => executeMerge(versionId),
    {
      triggerNext: (versionId, billId) =>
        triggerStep("assign", versionId, billId),
    }
  );
}
