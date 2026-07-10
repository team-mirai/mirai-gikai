import { Clock, MessageCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import type {
  MessageSearchFilterConfig,
  MessageSearchSession,
} from "../../shared/types";
import { buildSnippet } from "../../shared/utils/build-snippet";
import { formatJstDateTime } from "../../shared/utils/format-jst-date-time";
import { appendMessageSearchFilterParams } from "../../shared/utils/parse-message-search-filter-params";
import type { MessageSearchResult } from "../loaders/search-user-messages";
import { SEARCH_SESSIONS_PER_PAGE } from "../loaders/search-user-messages";
import { HighlightedText } from "./highlighted-text";
import { PaginationNav } from "./pagination-nav";
import { StanceBadge } from "./stance-badge";
import { VisibilityBadge } from "./visibility-badge";

const MAX_SNIPPETS_PER_SESSION = 3;

interface MessageSearchResultsProps {
  billId: string;
  configId: string;
  query: string;
  filters: MessageSearchFilterConfig;
  result: MessageSearchResult;
  currentPage: number;
}

function buildSearchPageUrl(
  billId: string,
  configId: string,
  query: string,
  filters: MessageSearchFilterConfig,
  page: number
): Route {
  const params = new URLSearchParams();
  params.set("q", query);
  appendMessageSearchFilterParams(params, filters);
  if (page > 1) {
    params.set("page", String(page));
  }
  return `${routes.billReportsSearch(billId, configId)}?${params.toString()}` as Route;
}

function buildDetailUrl(
  billId: string,
  configId: string,
  sessionId: string,
  query: string
): Route {
  const params = new URLSearchParams();
  params.set("highlight", query);
  return `${routes.billReportDetail(billId, configId, sessionId)}?${params.toString()}` as Route;
}

function SessionResultCard({
  billId,
  configId,
  query,
  session,
}: {
  billId: string;
  configId: string;
  query: string;
  session: MessageSearchSession;
}) {
  const visibleMessages = session.matched_messages.slice(
    0,
    MAX_SNIPPETS_PER_SESSION
  );
  const hiddenCount = session.matched_messages.length - visibleMessages.length;
  const report = session.interview_report;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Link
            href={buildDetailUrl(billId, configId, session.id, query)}
            className="font-mono text-sm text-blue-600 hover:underline"
          >
            {session.id.substring(0, 8)}...
          </Link>
          <StanceBadge stance={report?.stance || null} />
          {report && (
            <VisibilityBadge isPublic={report.is_public_by_admin ?? false} />
          )}
          {report?.role_title && (
            <span className="text-sm text-gray-600">{report.role_title}</span>
          )}
          <span className="inline-flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {formatJstDateTime(session.started_at)}
          </span>
        </div>

        <div className="space-y-2">
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800"
            >
              <MessageCircle className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
              <span>
                <HighlightedText
                  text={buildSnippet(message.content, query)}
                  query={query}
                />
              </span>
            </div>
          ))}
        </div>

        {hiddenCount > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            他 {hiddenCount} 件の発言がヒット
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MessageSearchResults({
  billId,
  configId,
  query,
  filters,
  result,
  currentPage,
}: MessageSearchResultsProps) {
  const { sessions, totalSessionCount, matchedMessageCount, isTruncated } =
    result;
  const totalPages = Math.ceil(totalSessionCount / SEARCH_SESSIONS_PER_PAGE);

  if (totalSessionCount === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-gray-500">
        「{query}」に一致する発言はありません
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {totalSessionCount} セッション / {matchedMessageCount} 件の発言がヒット
        {isTruncated && (
          <span className="ml-2 text-amber-600">
            （結果が多いため最新 {matchedMessageCount}
            件の発言のみを対象にしています。キーワードを絞り込んでください）
          </span>
        )}
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <SessionResultCard
            key={session.id}
            billId={billId}
            configId={configId}
            query={query}
            session={session}
          />
        ))}
      </div>

      <PaginationNav
        className="mt-6"
        totalPages={totalPages}
        currentPage={currentPage}
        buildHref={(page) =>
          buildSearchPageUrl(billId, configId, query, filters, page)
        }
      />
    </div>
  );
}
