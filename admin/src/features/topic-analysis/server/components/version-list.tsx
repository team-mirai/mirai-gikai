import { FileText } from "lucide-react";
import Link from "next/link";

import type { TopicAnalysisVersion } from "../../shared/types";

interface VersionListProps {
  versions: TopicAnalysisVersion[];
  billId: string;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: {
    label: "待機中",
    className: "text-yellow-600 bg-yellow-50",
  },
  running: {
    label: "実行中",
    className: "text-blue-600 bg-blue-50",
  },
  completed: {
    label: "完了",
    className: "text-green-600 bg-green-50",
  },
  failed: {
    label: "失敗",
    className: "text-red-600 bg-red-50",
  },
};

export function VersionList({ versions, billId }: VersionListProps) {
  if (versions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        まだトピック解析が実行されていません
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-medium">
              バージョン
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium">
              ステータス
            </th>
            <th className="text-left px-4 py-3 text-sm font-medium">
              作成日時
            </th>
            <th className="text-right px-4 py-3 text-sm font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {versions.map((version) => {
            const status = statusLabels[version.status] ?? statusLabels.pending;
            return (
              <tr key={version.id}>
                <td className="px-4 py-3 text-sm">v{version.version}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(version.created_at).toLocaleString("ja-JP")}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {version.status === "completed" && (
                    <Link
                      href={`/bills/${billId}/topic-analysis/${version.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      レポートを見る
                    </Link>
                  )}
                  {version.status === "failed" && version.error_message && (
                    <span className="text-red-500 text-xs">
                      {version.error_message}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
