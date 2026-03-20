import type { Route } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface TopicAnalysisHeaderProps {
  billId: string;
  billName: string;
  showBackToAnalysis?: boolean;
}

export function TopicAnalysisHeader({
  billId,
  billName,
  showBackToAnalysis,
}: TopicAnalysisHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        {showBackToAnalysis ? (
          <Link
            href={routes.billTopicAnalysis(billId) as Route}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            トピック解析に戻る
          </Link>
        ) : (
          <Link
            href={routes.bills()}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            議案一覧に戻る
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-bold">{billName}</h1>
    </div>
  );
}
