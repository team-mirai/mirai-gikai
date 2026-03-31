import type { Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/lib/routes";
import { BarChart3, Sparkles } from "lucide-react";
import type { InterviewConfigWithBill } from "@/features/interview-config/server/repositories/interview-config-repository";
import { getModeLabel } from "@/features/interview-config/shared/utils/get-mode-label";

interface AllInterviewConfigListProps {
  configs: InterviewConfigWithBill[];
  sessionCounts: Record<string, number> | null;
}

export function AllInterviewConfigList({
  configs,
  sessionCounts,
}: AllInterviewConfigListProps) {
  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {configs.length}件のインタビュー設定
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          インタビュー設定がありません。
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>設定名</TableHead>
                <TableHead>議案</TableHead>
                <TableHead>モード</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>セッション数</TableHead>
                <TableHead>作成日</TableHead>
                <TableHead>リンク</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <Link
                      href={
                        routes.billInterviewEdit(
                          config.bill_id,
                          config.id
                        ) as Route
                      }
                      className="font-medium hover:underline"
                    >
                      {config.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={routes.billInterview(config.bill_id) as Route}
                      className="text-gray-700 hover:underline"
                    >
                      {config.bill.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getModeLabel(config.mode)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        config.status === "public" ? "default" : "secondary"
                      }
                      className="w-16 justify-center"
                    >
                      {config.status === "public" ? "公開" : "非公開"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {sessionCounts ? (sessionCounts[config.id] ?? 0) : "-"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(config.created_at).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                      >
                        <Link
                          href={
                            routes.billReports(
                              config.bill_id,
                              config.id
                            ) as Route
                          }
                        >
                          <BarChart3 className="h-4 w-4" />
                          レポート
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                      >
                        <Link
                          href={
                            routes.billTopicAnalysis(
                              config.bill_id,
                              config.id
                            ) as Route
                          }
                        >
                          <Sparkles className="h-4 w-4" />
                          トピック解析
                        </Link>
                      </Button>
                    </div>
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
