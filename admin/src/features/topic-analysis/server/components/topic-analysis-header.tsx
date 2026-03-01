import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
            href={`/bills/${billId}/topic-analysis`}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            トピック解析に戻る
          </Link>
        ) : (
          <Link
            href={`/bills/${billId}`}
            className="flex items-center gap-1 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            議案詳細に戻る
          </Link>
        )}
      </div>
      <h1 className="text-2xl font-bold">{billName}</h1>
    </div>
  );
}
