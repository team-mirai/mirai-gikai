import { CheckCircle2, Clock, Lightbulb, XCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { routes } from "@/lib/routes";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SessionFilterBar } from "../../client/components/session-filter-bar";
import { ReportVisibilityListToggle } from "../../client/components/report-visibility-list-toggle";
import type {
  InterviewSessionWithDetails,
  SessionFilterConfig,
  SessionSortConfig,
} from "../../shared/types";
import {
  DEFAULT_SESSION_FILTER,
  DEFAULT_SESSION_SORT,
  formatDuration,
  getSessionStatus,
} from "../../shared/types";
import { generatePageNumbers } from "../../shared/utils/pagination-utils";
import { SESSIONS_PER_PAGE } from "../loaders/get-interview-sessions";
import { ModerationBadge } from "./moderation-badge";
import { RatingStars } from "./rating-stars";
import { SessionStatusBadge } from "./session-status-badge";
import { StanceBadge } from "./stance-badge";

interface SessionListProps {
  billId: string;
  sessions: InterviewSessionWithDetails[];
  totalCount: number;
  currentPage: number;
  sort?: SessionSortConfig;
  filters?: SessionFilterConfig;
}

function BooleanIcon({ value }: { value: boolean }) {
  if (value) {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-400" />;
}

function buildPageUrl(
  billId: string,
  page: number,
  sort: SessionSortConfig,
  filters: SessionFilterConfig
): Route {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (
    sort.field !== DEFAULT_SESSION_SORT.field ||
    sort.order !== DEFAULT_SESSION_SORT.order
  ) {
    params.set("sort", sort.field);
    params.set("order", sort.order);
  }
  if (filters.status !== DEFAULT_SESSION_FILTER.status) {
    params.set("status", filters.status);
  }
  if (filters.visibility !== DEFAULT_SESSION_FILTER.visibility) {
    params.set("visibility", filters.visibility);
  }
  if (filters.stance !== DEFAULT_SESSION_FILTER.stance) {
    params.set("stance", filters.stance);
  }
  if (filters.role !== DEFAULT_SESSION_FILTER.role) {
    params.set("role", filters.role);
  }
  if (filters.moderation !== DEFAULT_SESSION_FILTER.moderation) {
    params.set("moderation", filters.moderation);
  }
  return `${routes.billReports(billId)}?${params.toString()}` as Route;
}

export function SessionList({
  billId,
  sessions,
  totalCount,
  currentPage,
  sort = DEFAULT_SESSION_SORT,
  filters = DEFAULT_SESSION_FILTER,
}: SessionListProps) {
  const totalPages = Math.ceil(totalCount / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + sessions.length, totalCount);

  return (
    <div>
      <SessionFilterBar currentFilters={filters} />

      {sessions.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-gray-500">
          条件に一致するセッションがありません
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-end">
          <div className="text-sm text-gray-600">
            全 {totalCount} 件中 {startIndex + 1}〜{endIndex} 件を表示
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-32">セッションID</TableHead>
                  <TableHead className="w-24">ステータス</TableHead>
                  <TableHead className="w-24 text-center">
                    ユーザー公開
                  </TableHead>
                  <TableHead className="w-24 text-center">管理者公開</TableHead>
                  <TableHead className="w-28">スタンス</TableHead>
                  <TableHead className="w-40">役割名</TableHead>
                  <SortableTableHead
                    field="total_content_richness"
                    currentField={sort.field}
                    currentOrder={sort.order}
                    className="w-20 text-right"
                  >
                    充実度
                  </SortableTableHead>
                  <SortableTableHead
                    field="moderation_score"
                    currentField={sort.field}
                    currentOrder={sort.order}
                    className="w-32"
                  >
                    モデレーション
                  </SortableTableHead>
                  <TableHead className="w-24 text-center">満足度</TableHead>
                  <SortableTableHead
                    field="started_at"
                    currentField={sort.field}
                    currentOrder={sort.order}
                    className="w-44"
                  >
                    開始時刻
                  </SortableTableHead>
                  <TableHead className="w-24">時間</TableHead>
                  <SortableTableHead
                    field="message_count"
                    currentField={sort.field}
                    currentOrder={sort.order}
                    className="w-24 text-right"
                  >
                    メッセージ数
                  </SortableTableHead>
                  <SortableTableHead
                    field="helpful_count"
                    currentField={sort.field}
                    currentOrder={sort.order}
                    className="w-24 text-right"
                  >
                    参考になる
                  </SortableTableHead>
                  <TableHead className="w-64">要約</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const status = getSessionStatus(session);
                  const duration = formatDuration(
                    session.started_at,
                    session.completed_at
                  );
                  const hasReport = !!session.interview_report;

                  return (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={
                            routes.billReportDetail(billId, session.id) as Route
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {session.id.substring(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <SessionStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-center">
                        {hasReport ? (
                          <BooleanIcon
                            value={
                              session.interview_report?.is_public_by_user ??
                              false
                            }
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasReport && session.interview_report ? (
                          <ReportVisibilityListToggle
                            reportId={session.interview_report.id}
                            sessionId={session.id}
                            billId={billId}
                            isPublic={
                              session.interview_report.is_public_by_admin ??
                              false
                            }
                            isPublicByUser={
                              session.interview_report.is_public_by_user ??
                              false
                            }
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StanceBadge
                          stance={session.interview_report?.stance || null}
                        />
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {session.interview_report?.role_title || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {session.interview_report?.total_content_richness !=
                        null
                          ? session.interview_report.total_content_richness
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <ModerationBadge
                          status={
                            session.interview_report?.moderation_status ?? null
                          }
                          score={
                            session.interview_report?.moderation_score ?? null
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {session.rating != null ? (
                          <RatingStars rating={session.rating} />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(session.started_at).toLocaleString(
                            "ja-JP",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Tokyo",
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {duration}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {session.message_count}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {session.helpful_count > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Lightbulb className="h-4 w-4 text-blue-500" />
                            {session.helpful_count}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        <span className="line-clamp-2">
                          {session.interview_report?.summary || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst
                href={buildPageUrl(billId, 1, sort, filters)}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                href={buildPageUrl(
                  billId,
                  currentPage > 1 ? currentPage - 1 : 1,
                  sort,
                  filters
                )}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {generatePageNumbers(totalPages, currentPage).map((page) =>
              typeof page === "string" ? (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={buildPageUrl(billId, page, sort, filters)}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={buildPageUrl(
                  billId,
                  currentPage < totalPages ? currentPage + 1 : totalPages,
                  sort,
                  filters
                )}
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationLast
                href={buildPageUrl(billId, totalPages, sort, filters)}
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
