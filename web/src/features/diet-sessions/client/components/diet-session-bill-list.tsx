import type { BillWithContent } from "@/features/bills/shared/types";
import { formatDateWithDots } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";
import { BillListWithStatusFilter } from "./bill-list-with-status-filter";

type Props = {
  session: DietSession;
  bills: BillWithContent[];
};

export function DietSessionBillList({ session, bills }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{session.name}に提出された法案</h1>
        <p className="text-muted-foreground text-sm">
          {formatDateWithDots(session.start_date)} 〜{" "}
          {formatDateWithDots(session.end_date)}
        </p>
      </div>

      {/* フィルター付き法案リスト */}
      {bills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          この会期の法案はまだありません
        </p>
      ) : (
        <BillListWithStatusFilter bills={bills} />
      )}

      {/* 衆議院リンク */}
      {session.shugiin_url && (
        <div className="text-right text-sm pt-4">
          {session.name}に提出された全ての法案は{" "}
          <a
            href={session.shugiin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline inline-flex items-center gap-1"
          >
            国会議案情報へ
            <span className="text-xs">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
