import { ExternalLink } from "lucide-react";
import Image from "next/image";
import type { BillWithContent } from "@/features/bills/shared/types";
import type { DietSession } from "../../shared/types";
import { BillListWithStatusFilter } from "./bill-list-with-status-filter";

type Props = {
  session: DietSession;
  bills: BillWithContent[];
};

export function DietSessionBillList({ session, bills }: Props) {
  const startDate = new Date(session.start_date);
  const endDate = new Date(session.end_date);
  const sessionDescription = `${startDate.getFullYear()}.${startDate.getMonth() + 1}月〜${endDate.getMonth() + 1}月に実施された${session.name}`;

  return (
    <div className="flex flex-col gap-8">
      {/* Archiveヘッダー */}
      <div className="flex flex-col gap-1">
        <h1>
          <Image
            src="/icons/archive-typography.svg"
            alt="Archive"
            width={156}
            height={36}
            priority
          />
        </h1>
        <p className="text-sm font-bold text-primary-accent">
          過去の草津市議会に提出された議案
        </p>
      </div>

      {/* セクションヘッダー */}
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[22px] font-bold text-black leading-[1.48] flex items-center gap-4">
          {startDate.getFullYear()}年 {session.name}の提出議案
          <span>{bills.length}件</span>
        </h2>
        <p className="text-xs font-medium text-mirai-text">
          {sessionDescription}
        </p>
      </div>

      {/* フィルター付き議案リスト */}
      {bills.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">
          この会期の議案はまだありません
        </p>
      ) : (
        <BillListWithStatusFilter bills={bills} />
      )}

      {/* 草津市議会の公式情報へのリンク */}
      {session.shugiin_url && (
        <div className="flex items-center gap-1 text-[13px] font-medium text-mirai-text">
          {startDate.getFullYear()}年{session.name}に提出された全ての議案は
          <a
            href={session.shugiin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
          >
            草津市議会の議案情報へ
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
