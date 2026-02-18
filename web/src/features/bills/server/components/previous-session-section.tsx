import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import { CompactBillCard } from "../../client/components/bill-list/compact-bill-card";
import type { BillWithContent } from "../../shared/types";

interface PreviousSessionSectionProps {
  session: DietSession;
  bills: BillWithContent[];
}

const VISIBLE_BILLS = 5;

export function PreviousSessionSection({
  session,
  bills,
}: PreviousSessionSectionProps) {
  const hasFade = bills.length > VISIBLE_BILLS;
  const visibleBills = bills.slice(0, VISIBLE_BILLS);

  // slugがない場合はセクションを表示しない
  if (!session.slug || bills.length === 0) {
    return null;
  }

  const sessionBillsUrl = `/kokkai/${session.slug}/bills`;

  return (
    <section className="flex flex-col gap-6">
      {/* Archiveヘッダー */}
      <div className="flex flex-col gap-4">
        <h2>
          <Image
            src="/icons/archive-typography.svg"
            alt="Archive"
            width={156}
            height={36}
            priority
          />
        </h2>
        <p className="text-sm font-bold text-primary-accent">
          過去の国会に提出された法案
        </p>
      </div>

      {/* セクションヘッダー（リンク付き） */}
      <Link href={sessionBillsUrl} className="group">
        <h3 className="text-[22px] font-bold text-[#1F2937] leading-[1.48] flex items-center gap-2">
          {new Date(session.start_date).getFullYear()}年 {session.name}の法案
          <span className="text-[#404040]">{bills.length}件</span>
          <ChevronRight className="h-5 w-5 text-gray-600 group-hover:translate-x-0.5 transition-transform" />
        </h3>
      </Link>

      {/* 議案カードリスト */}
      <div className="relative flex flex-col gap-3">
        {visibleBills.map((bill, index) => {
          const isLastVisibleCard = hasFade && index === VISIBLE_BILLS - 1;
          // 最後のカードはセッションページへのリンク（もっと読むボタンとして機能）
          const href = isLastVisibleCard
            ? sessionBillsUrl
            : `/bills/${bill.id}`;

          return (
            <Link key={bill.id} href={href}>
              <CompactBillCard
                bill={bill}
                // 最後のカードは少し淡く表示して「続きを見る」感を出す
                className={isLastVisibleCard ? "opacity-60" : undefined}
              />
            </Link>
          );
        })}

        {/* もっと読むリンク（グラデーションオーバーレイ付き） */}
        {hasFade && (
          <div className="pointer-events-none absolute inset-x-0 -bottom-4 h-24">
            {/* 上部: グラデーション */}
            <div className="h-16 bg-gradient-to-t from-white to-white/10" />
            {/* 下部: 完全に白 + ボタン */}
            <div className="h-8 bg-white flex items-start justify-center pointer-events-auto">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-[214px] h-12 text-base font-medium border-black rounded-full hover:bg-gray-50 bg-white -mt-8"
              >
                <Link href={sessionBillsUrl}>もっと読む</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
