import type { Route } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { BillCard } from "../../client/components/bill-list/bill-card";
import type { BillWithContent } from "../../shared/types";

interface InterviewOpenBillSectionProps {
  bills: BillWithContent[];
}

/**
 * トップの「AIインタビュー受付中」セクション。
 *
 * 受付中の記事はカード内のピルでしか分からず、他のセクションに散っていると
 * 「今どれに意見を出せるのか」を拾うのにトップ全体を追う必要がある。
 * 見出し付きで先頭にまとめて、意見を出す導線を最初に見せる。
 *
 * 説明文はタグ別セクションの説明（「〜に関する法案」）と同じ体言止めで揃える。
 * ただし載るのは法案だけではない（検討会や報告書の解説記事もある）ので、
 * 種別を限定しない「テーマ」で受ける。
 *
 * 他のセクションは2件目以降をコンパクトにするが、ここは意見を出す入口なので
 * 全件フルカードで要約まで見せる。
 */
export function InterviewOpenBillSection({
  bills,
}: InterviewOpenBillSectionProps) {
  if (bills.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-6">
      {/* セクションヘッダー */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[22px] font-bold text-mirai-text leading-[1.48]">
          AIインタビュー受付中
        </h2>
        <p className="text-xs font-medium text-mirai-text-secondary leading-[1.67]">
          意見募集中のテーマ
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {bills.map((bill) => (
          <Link key={bill.id} href={routes.billDetail(bill.id) as Route}>
            <BillCard bill={bill} />
          </Link>
        ))}
      </div>
    </section>
  );
}
