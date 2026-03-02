"use client";

import Markdown from "react-markdown";
import type {
  TopicAnalysisTopic,
  TopicAnalysisVersion,
} from "../../shared/types";
import {
  buildReportMarkdown,
  buildToc,
  toSlug,
} from "../../shared/utils/report-builder";

interface AnalysisReportProps {
  version: TopicAnalysisVersion;
  topics: TopicAnalysisTopic[];
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
