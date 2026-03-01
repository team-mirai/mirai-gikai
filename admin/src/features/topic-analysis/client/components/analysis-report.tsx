"use client";

import Markdown from "react-markdown";
import type {
  RepresentativeOpinion,
  TopicAnalysisTopic,
  TopicAnalysisVersion,
} from "../../shared/types";

interface AnalysisReportProps {
  version: TopicAnalysisVersion;
  topics: TopicAnalysisTopic[];
}

type TocEntry = { id: string; label: string };

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

function buildToc(
  hasSummary: boolean,
  topics: TopicAnalysisTopic[]
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

function buildReportMarkdown(
  version: TopicAnalysisVersion,
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
          topicSection += `\n> **${op.opinion_title}**\n>\n> ${op.opinion_content}\n`;
        }
      }

      sections.push(topicSection);
    }
  }

  return sections.join("\n\n");
}

export function AnalysisReport({ version, topics }: AnalysisReportProps) {
  const hasSummary = !!version.summary_md;
  const toc = buildToc(hasSummary, topics);
  const markdown = buildReportMarkdown(version, topics);

  return (
    <div className="border rounded-lg p-8">
      {/* 目次 */}
      {toc.length > 0 && (
        <nav className="mb-8 rounded-lg bg-muted/40 p-5">
          <p className="text-sm font-semibold mb-3">目次</p>
          <ul className="list-none space-y-1.5 text-sm">
            {toc.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="text-primary hover:underline"
                >
                  {entry.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* レポート本文 */}
      <article className="prose prose-base max-w-none prose-headings:border-b prose-headings:pb-2 prose-h1:text-2xl prose-h1:mb-6 prose-h2:text-xl prose-h2:mt-10 prose-h2:border-primary/20 prose-h3:text-base prose-h3:border-none prose-h3:mt-6 prose-blockquote:border-l-primary/40 prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-hr:my-8">
        <Markdown
          components={{
            h1: ({ children, ...props }) => {
              const text = String(children);
              const id = toSlug(text);
              return (
                <h1 id={id} {...props}>
                  {children}
                </h1>
              );
            },
            h2: ({ children, ...props }) => {
              const text = String(children);
              const id = toSlug(text);
              return (
                <h2 id={id} {...props}>
                  {children}
                </h2>
              );
            },
          }}
        >
          {markdown}
        </Markdown>
      </article>
    </div>
  );
}
