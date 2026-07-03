import type { Route } from "next";
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
import { generatePageNumbers } from "../../shared/utils/pagination-utils";

interface PaginationNavProps {
  totalPages: number;
  currentPage: number;
  buildHref: (page: number) => Route;
  className?: string;
}

/**
 * ページ番号リンク付きのページネーションナビゲーション。
 * totalPages が 1 以下の場合は何も表示しない。
 */
export function PaginationNav({
  totalPages,
  currentPage,
  buildHref,
  className,
}: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const prevDisabledClass =
    currentPage <= 1 ? "pointer-events-none opacity-50" : "";
  const nextDisabledClass =
    currentPage >= totalPages ? "pointer-events-none opacity-50" : "";

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationFirst
            href={buildHref(1)}
            aria-disabled={currentPage <= 1}
            className={prevDisabledClass}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationPrevious
            href={buildHref(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage <= 1}
            className={prevDisabledClass}
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
                href={buildHref(page)}
                isActive={page === currentPage}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage >= totalPages}
            className={nextDisabledClass}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationLast
            href={buildHref(totalPages)}
            aria-disabled={currentPage >= totalPages}
            className={nextDisabledClass}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
