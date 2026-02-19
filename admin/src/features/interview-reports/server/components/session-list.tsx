import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SESSIONS_PER_PAGE } from "../loaders/get-interview-sessions";
import type { InterviewSessionWithDetails } from "../../shared/types";
import { formatDuration, getSessionStatus } from "../../shared/types";
import { generatePageNumbers } from "../../shared/utils/pagination-utils";
import { SessionStatusBadge } from "./session-status-badge";
import { StanceBadge } from "./stance-badge";
import { VisibilityBadge } from "./visibility-badge";

interface SessionListProps {
  billId: string;
  sessions: InterviewSessionWithDetails[];
  totalCount: number;
  currentPage: number;
}

function BooleanIcon({ value }: { value: boolean }) {
  if (value) {
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  }
  return <XCircle className="h-5 w-5 text-red-400" />;
}

export function SessionList({
  billId,
  sessions,
  totalCount,
  currentPage,
}: SessionListProps) {
  const totalPages = Math.ceil(totalCount / SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + sessions.length, totalCount);

  if (sessions.length === 0 && currentPage === 1) {
    return (
      <div className="rounded-lg border p-8 text-center text-gray-500">
        まだセッションがありません
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <div className="text-sm text-gray-600">
          全 {totalCount} 件中 {startIndex + 1}〜{endIndex} 件を表示
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16">No.</TableHead>
              <TableHead className="w-32">セッションID</TableHead>
              <TableHead className="w-24">ステータス</TableHead>
              <TableHead className="w-20 text-center">レポート</TableHead>
              <TableHead className="w-20 text-center">公開</TableHead>
              <TableHead className="w-28">スタンス</TableHead>
              <TableHead className="w-28">役割</TableHead>
              <TableHead className="w-44">開始時刻</TableHead>
              <TableHead className="w-24">時間</TableHead>
              <TableHead className="w-24 text-right">メッセージ数</TableHead>
              <TableHead className="w-32">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, index) => {
              const status = getSessionStatus(session);
              const duration = formatDuration(
                session.started_at,
                session.completed_at
              );
              const hasReport = !!session.interview_report;
              const rowNumber = totalCount - startIndex - index;

              return (
                <TableRow key={session.id}>
                  <TableCell className="font-medium text-blue-600">
                    #{rowNumber}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {session.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <SessionStatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <BooleanIcon value={hasReport} />
                  </TableCell>
                  <TableCell className="text-center">
                    {hasReport ? (
                      <VisibilityBadge
                        isPublic={
                          session.interview_report?.is_public_by_admin ?? false
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
                    {session.interview_report?.role || "-"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(session.started_at).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{duration}</TableCell>
                  <TableCell className="text-right font-medium">
                    {session.message_count}
                  </TableCell>
                  <TableCell>
                    <Link href={`/bills/${billId}/reports/${session.id}`}>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-blue-600"
                      >
                        詳細を見る
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst
                href={`/bills/${billId}/reports?page=1`}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            <PaginationItem>
              <PaginationPrevious
                href={
                  currentPage > 1
                    ? `/bills/${billId}/reports?page=${currentPage - 1}`
                    : `/bills/${billId}/reports?page=1`
                }
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {/* ページ番号表示（最大5ページ表示、省略記号付き） */}
            {generatePageNumbers(totalPages, currentPage).map((page) =>
              typeof page === "string" ? (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={`/bills/${billId}/reports?page=${page}`}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={
                  currentPage < totalPages
                    ? `/bills/${billId}/reports?page=${currentPage + 1}`
                    : `/bills/${billId}/reports?page=${totalPages}`
                }
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
                href={`/bills/${billId}/reports?page=${totalPages}`}
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
