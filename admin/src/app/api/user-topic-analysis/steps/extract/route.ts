import { executeExtract } from "@/features/user-topic-analysis/server/services/orchestrator";
import { handleStepRoute } from "@/features/user-topic-analysis/server/utils/handle-step-route";
import { triggerStep } from "@/features/user-topic-analysis/server/utils/trigger-step";

export const maxDuration = 300;

export async function POST(request: Request) {
  return handleStepRoute(
    request,
    "extract",
    (versionId, billId) => executeExtract(versionId, billId),
    {
      triggerNext: (versionId, billId) =>
        triggerStep("merge", versionId, billId),
    }
  );
}
