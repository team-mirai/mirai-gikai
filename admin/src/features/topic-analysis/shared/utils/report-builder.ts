import type {
  RepresentativeOpinion,
  TopicAnalysisTopic,
  TopicAnalysisVersion,
} from "../types";

export type TocEntry = { id: string; label: string };

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export function buildToc(
  hasSummary: boolean,
  topics: Pick<TopicAnalysisTopic, "name">[]
): TocEntry[] {
  const entries: TocEntry[] = [];
  if (hasSummary) {
    entries.push({ id: toSlug("全体サマリ"), label: "全体サマリ" });
  }
  for (let i = 0; i < topics.length; i++) {
    const label = `トピック${i + 1}. ${topics[i].name}`;
    entries.push({ id: toSlug(label), label });
  }
  return entries;
}

export function buildReportMarkdown(
  version: Pick<TopicAnalysisVersion, "summary_md">,
  topics: TopicAnalysisTopic[]
): string {
  const sections: string[] = [];

  // 全体サマリ
  if (version.summary_md) {
    sections.push(`# 全体サマリ\n\n${version.summary_md}`);
  }

  // トピック詳細
  if (topics.length > 0) {
    sections.push("---");

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const representatives = (
        Array.isArray(topic.representative_opinions)
          ? topic.representative_opinions
          : []
      ) as RepresentativeOpinion[];

      let topicSection = `## トピック${i + 1}. ${topic.name}`;
      topicSection += `\n\n${topic.description_md}`;

      if (representatives.length > 0) {
        topicSection += "\n\n### 代表的な意見\n";
        for (const op of representatives) {
          const refLabel = op.ref_id ? ` （インタビュー#${op.ref_id}）` : "";
          const content = op.source_message_content || op.opinion_content;
          topicSection += `\n> **${op.opinion_title}**${refLabel}\n>\n> ${content}\n`;
        }
      }

      sections.push(topicSection);
    }
  }

  return sections.join("\n\n");
}
