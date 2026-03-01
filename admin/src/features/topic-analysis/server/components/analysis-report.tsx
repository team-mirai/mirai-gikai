import type {
  RepresentativeOpinion,
  TopicAnalysisTopic,
  TopicAnalysisVersion,
} from "../../shared/types";

interface AnalysisReportProps {
  version: TopicAnalysisVersion;
  topics: TopicAnalysisTopic[];
}

export function AnalysisReport({ version, topics }: AnalysisReportProps) {
  return (
    <div className="space-y-8">
      {/* 全体サマリ */}
      {version.summary_md && (
        <section className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">全体サマリ</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {version.summary_md}
          </div>
        </section>
      )}

      {/* トピック一覧 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          トピック一覧（{topics.length}件）
        </h2>
        <div className="space-y-6">
          {topics.map((topic) => {
            const representatives = (
              Array.isArray(topic.representative_opinions)
                ? topic.representative_opinions
                : []
            ) as RepresentativeOpinion[];

            return (
              <div key={topic.id} className="border rounded-lg p-6">
                <h3 className="text-base font-semibold mb-3">{topic.name}</h3>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap mb-4">
                  {topic.description_md}
                </div>

                {/* 代表的な意見 */}
                {representatives.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      代表的な意見
                    </h4>
                    <div className="space-y-2">
                      {representatives.map((op, i) => (
                        <div
                          key={`${op.session_id}-${i}`}
                          className="bg-muted/50 rounded-lg p-3"
                        >
                          <p className="text-sm font-medium">
                            {op.opinion_title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {op.opinion_content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
