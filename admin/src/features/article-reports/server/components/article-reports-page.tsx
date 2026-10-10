import "server-only";

import { ARTICLE_REPORT_CATEGORY_LABELS } from "@mirai-gikai/shared/article-report/categories";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIFFICULTY_LEVELS } from "@/features/bills-edit/shared/types/bill-contents";
import { formatJstDateTime } from "@/features/interview-reports/shared/utils/format-jst-date-time";
import { getArticleReports } from "../loaders/get-article-reports";

function getDifficultyLabel(value: string): string {
  return (
    DIFFICULTY_LEVELS.find((level) => level.value === value)?.label ?? value
  );
}

export async function ArticleReportsPage({ billId }: { billId: string }) {
  const data = await getArticleReports(billId);
  if (!data) {
    notFound();
  }
  const { billName, reports } = data;

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-1 text-2xl font-bold">誤り報告</h1>
      <p className="mb-4 text-sm text-gray-600">議案: {billName}</p>

      {reports.length === 0 ? (
        <p className="rounded border bg-white p-6 text-sm text-gray-500">
          誤り報告はまだありません。
        </p>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">日時</TableHead>
                <TableHead className="w-20">難易度</TableHead>
                <TableHead className="w-28">種類</TableHead>
                <TableHead>本文</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="align-top">
                    {formatJstDateTime(report.created_at)}
                  </TableCell>
                  <TableCell className="align-top">
                    {getDifficultyLabel(report.difficulty_level)}
                  </TableCell>
                  <TableCell className="align-top">
                    {report.category
                      ? ARTICLE_REPORT_CATEGORY_LABELS[report.category]
                      : "未選択"}
                  </TableCell>
                  <TableCell className="whitespace-pre-wrap break-words align-top">
                    {report.body}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
