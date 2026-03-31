import "server-only";
import { FileText } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StanceBadge } from "@/features/interview-reports/server/components/stance-badge";
import { routes } from "@/lib/routes";
import type { Expert } from "../../shared/types";

type ExpertListProps = {
  experts: Expert[];
};

export function ExpertList({ experts }: ExpertListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        有識者一覧 ({experts.length}件)
      </h2>

      {experts.length === 0 ? (
        <p className="text-gray-500">登録された有識者がいません</p>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>所属</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead>回答済みレポート</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {experts.map((expert) => (
                <TableRow key={expert.id}>
                  <TableCell className="font-medium">{expert.name}</TableCell>
                  <TableCell>{expert.email}</TableCell>
                  <TableCell>{expert.affiliation}</TableCell>
                  <TableCell>
                    {new Date(expert.created_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </TableCell>
                  <TableCell>
                    {expert.reports.length === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {expert.reports.map((report) => (
                          <Link
                            key={report.sessionId}
                            href={routes.billReportDetail(
                              report.billId,
                              report.configId,
                              report.sessionId
                            )}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-48">
                              {report.billName}
                            </span>
                            <StanceBadge stance={report.stance} />
                          </Link>
                        ))}
                      </div>
                    )}
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
