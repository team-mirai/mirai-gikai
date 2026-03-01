import "server-only";

import { findVersionsByBillId } from "../repositories/topic-analysis-repository";

export async function getTopicAnalysisVersions(billId: string) {
  return findVersionsByBillId(billId);
}
