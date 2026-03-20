import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Frown, Lightbulb, MessageCircle, User } from "lucide-react";
import { ReportVisibilityToggle } from "../../client/components/report-visibility-toggle";
import { formatRoleLabel } from "../../shared/constants";
import type { InterviewSessionDetail } from "../../shared/types";
import { formatDuration, getSessionStatus } from "../../shared/types";
import { getMessageDisplayText } from "../../shared/utils/get-message-display-text";
import { parseOpinions } from "../../shared/utils/parse-opinions";
import { RatingStars } from "./rating-stars";
import { SessionStatusBadge } from "./session-status-badge";
import { StanceBadge } from "./stance-badge";

interface SessionDetailProps {
  session: InterviewSessionDetail;
  billId: string;
}

const scoreLabels: Record<string, string> = {
  total: "総合",
  clarity: "明確さ",
  specificity: "具体性",
  impact: "影響度",
  constructiveness: "建設性",
};

function ScoreBar({ label, value }: { label: string; value: number }) {
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

  const scores = report?.scores as Record<string, unknown> | null;

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
            />
          )}
        </CardHeader>
        <CardContent>
          {report ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      {/* スコア・リアクション */}
      {report && (scores || reactionCounts) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">評価・リアクション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* スコア */}
              {scores && (
                <div>
                  <div className="text-sm text-gray-500 mb-3">
                    レポートスコア
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(scoreLabels).map(([key, label]) => {
                      const value = scores[key];
                      if (typeof value !== "number") return null;
                      return <ScoreBar key={key} label={label} value={value} />;
                    })}
                  </div>
                  {typeof scores.reasoning === "string" && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-1">
                        スコア根拠
                      </div>
                      <div className="text-sm bg-gray-50 p-3 rounded-lg">
                        {scores.reasoning}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* リアクション */}
              {reactionCounts && (
                <div>
                  <div className="text-sm text-gray-500 mb-3">
                    ユーザーリアクション
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Lightbulb className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">参考になる</div>
                        <div className="text-lg font-semibold">
                          {reactionCounts.helpful}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                        <Frown className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">うーん...</div>
                        <div className="text-lg font-semibold">
                          {reactionCounts.hmm}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* チャット生データ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャット履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-24">役割</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="w-44">時刻</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            message.role === "assistant"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {message.role === "assistant" ? "AI" : "ユーザー"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap">
                        {getMessageDisplayText(message.content)}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(message.created_at).toLocaleString("ja-JP", {
                          timeZone: "Asia/Tokyo",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">メッセージはありません</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
