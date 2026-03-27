import "server-only";
import { Bot, Clock, Lightbulb, MessageCircle, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateContentRichnessButton } from "../../client/components/regenerate-content-richness-button";
import { RegenerateModerationButton } from "../../client/components/regenerate-moderation-button";
import { ReportVisibilityToggle } from "../../client/components/report-visibility-toggle";
import { formatRoleLabel } from "../../shared/constants";
import { FEEDBACK_TAG_LABELS } from "../../shared/constants/feedback-tags";
import type { InterviewSessionDetail } from "../../shared/types";
import { formatDuration, getSessionStatus } from "../../shared/types";
import { getMessageDisplayText } from "../../shared/utils/get-message-display-text";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import { ModerationBadge } from "./moderation-badge";
import { RatingStars } from "./rating-stars";
import { SessionStatusBadge } from "./session-status-badge";
import { StanceBadge } from "./stance-badge";

interface SessionDetailProps {
  session: InterviewSessionDetail;
  billId: string;
}

const contentRichnessLabels: Record<string, string> = {
  total: "総合",
  clarity: "明確さ",
  specificity: "具体性",
  impact: "影響への言及",
  constructiveness: "提案の広がり",
};

function ContentRichnessBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm text-gray-500 shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-8 text-sm font-medium text-right">{value}</div>
    </div>
  );
}

export function SessionDetail({ session, billId }: SessionDetailProps) {
  const status = getSessionStatus(session);
  const duration = formatDuration(session.started_at, session.completed_at);
  const report = session.interview_report;
  const messages = session.interview_messages;
  const reactionCounts = session.reaction_counts;

  const contentRichness = report?.content_richness as Record<
    string,
    unknown
  > | null;

  return (
    <div className="space-y-6">
      {/* セッション情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">セッション情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">セッションID</div>
              <div className="font-mono text-sm">{session.id}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ステータス</div>
              <div className="mt-1">
                <SessionStatusBadge status={status} />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">開始時刻</div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                {new Date(session.started_at).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                })}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">所要時間</div>
              <div className="text-sm">{duration}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ユーザーID</div>
              <div className="font-mono text-sm text-gray-600">
                {session.user_id}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">メッセージ数</div>
              <div className="flex items-center gap-1 text-sm">
                <MessageCircle className="h-4 w-4 text-gray-400" />
                {messages.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ユーザー評価</div>
              <div className="mt-1">
                {session.rating ? (
                  <RatingStars rating={session.rating} showLabel />
                ) : (
                  <span className="text-sm text-gray-400">未評価</span>
                )}
              </div>
            </div>
            {session.feedback_tags.length > 0 && (
              <div>
                <div className="text-sm text-gray-500">フィードバック</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {session.feedback_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {(FEEDBACK_TAG_LABELS as Record<string, string>)[tag] ??
                        tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {reactionCounts && (
              <div>
                <div className="text-sm text-gray-500">参考になる</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold">
                    {reactionCounts.helpful}
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* レポート情報 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">レポート</CardTitle>
          {report && (
            <ReportVisibilityToggle
              reportId={report.id}
              sessionId={session.id}
              billId={billId}
              isPublic={report.is_public_by_admin ?? false}
              isPublicByUser={report.is_public_by_user ?? false}
            />
          )}
        </CardHeader>
        <CardContent>
          {report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">スタンス</div>
                  <div className="mt-1">
                    <StanceBadge stance={report.stance} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">役割</div>
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    {formatRoleLabel(report.role, report.role_title) || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">役割の説明</div>
                  <div className="text-sm">
                    {report.role_description || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">モデレーション</div>
                  <div className="mt-1">
                    <ModerationBadge
                      status={report.moderation_status}
                      score={report.moderation_score}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">情報充実度</div>
                  <div className="text-sm">
                    {contentRichness &&
                    typeof contentRichness.total === "number"
                      ? `${contentRichness.total} / 100`
                      : "-"}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">要約</div>
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  {report.summary || "-"}
                </div>
              </div>
              {report.opinions && parseOpinions(report.opinions).length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">意見</div>
                  <div className="space-y-3">
                    {parseOpinions(report.opinions).map((opinion, index) => (
                      <div
                        key={`opinion-${index}-${opinion.title.slice(0, 20)}`}
                        className="bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            意見{index + 1}
                          </Badge>
                          <span className="text-sm font-medium">
                            {opinion.title}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {opinion.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              レポートはまだ生成されていません
            </div>
          )}
        </CardContent>
      </Card>

      {/* モデレーション・情報充実度 */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* モデレーションスコア */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">モデレーション</CardTitle>
              <RegenerateModerationButton
                reportId={report.id}
                sessionId={session.id}
                billId={billId}
              />
            </CardHeader>
            <CardContent>
              {report.moderation_score != null ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 w-16 shrink-0">
                      スコア
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          report.moderation_status === "ok"
                            ? "bg-green-500"
                            : report.moderation_status === "warning"
                              ? "bg-orange-500"
                              : "bg-red-500"
                        }`}
                        style={{
                          width: `${report.moderation_score}%`,
                        }}
                      />
                    </div>
                    <div className="w-12 text-sm font-medium text-right">
                      {report.moderation_score} / 100
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    0-29: OK / 30-69: Warning / 70-100: NG
                  </div>
                  {report.moderation_reasoning && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-1">根拠</div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {report.moderation_reasoning}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  モデレーション評価はまだ実行されていません
                </div>
              )}
            </CardContent>
          </Card>

          {/* 情報充実度 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">情報充実度</CardTitle>
              <RegenerateContentRichnessButton
                reportId={report.id}
                sessionId={session.id}
                billId={billId}
              />
            </CardHeader>
            <CardContent>
              {contentRichness ? (
                <>
                  <div className="space-y-2.5">
                    {Object.entries(contentRichnessLabels).map(
                      ([key, label]) => {
                        const value = contentRichness[key];
                        if (typeof value !== "number") return null;
                        return (
                          <ContentRichnessBar
                            key={key}
                            label={label}
                            value={value}
                          />
                        );
                      }
                    )}
                  </div>
                  {typeof contentRichness.reasoning === "string" && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-1">評価根拠</div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {contentRichness.reasoning}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 text-sm">
                  情報充実度評価はまだ実行されていません
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* チャット履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャット履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => {
                const isAssistant = message.role === "assistant";
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isAssistant
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isAssistant ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] ${isAssistant ? "" : "text-right"}`}
                    >
                      <div
                        className={`inline-block rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap text-left ${
                          isAssistant
                            ? "bg-blue-50 text-gray-800 rounded-tl-sm"
                            : "bg-gray-100 text-gray-800 rounded-tr-sm"
                        }`}
                      >
                        {getMessageDisplayText(message.content)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 px-1">
                        {new Date(message.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">メッセージはありません</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
