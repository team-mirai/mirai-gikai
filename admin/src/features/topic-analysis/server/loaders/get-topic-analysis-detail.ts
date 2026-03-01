import "server-only";

import {
  findTopicsByVersionId,
  findVersionById,
} from "../repositories/topic-analysis-repository";

export async function getTopicAnalysisDetail(versionId: string) {
  const [version, topics] = await Promise.all([
    findVersionById(versionId),
    findTopicsByVersionId(versionId),
  ]);

  if (!version) {
    return null;
  }

  return { version, topics };
}
