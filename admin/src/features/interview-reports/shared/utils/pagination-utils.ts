/**
 * ページネーションのoffset/limit計算とページ番号リスト生成
 */

/**
 * ページ番号からoffset（from）とlimit（to）を計算する
 */
export function calculatePaginationRange(
  page: number,
  perPage: number
): { from: number; to: number } {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  return { from, to };
}

/**
 * ページ番号リストを生成する（省略記号付き、最大5ページ表示）
 */
export function generatePageNumbers(
  totalPages: number,
  currentPage: number
): (number | "ellipsis-start" | "ellipsis-end")[] {
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis-start");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages);
  }

  return pages;
}
