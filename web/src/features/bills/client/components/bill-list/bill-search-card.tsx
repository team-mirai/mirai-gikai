import Image from "next/image";
import Link from "next/link";
import { RubySafeLineClamp } from "@/components/ruby-safe-line-clamp";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { ReviewCompleteBadge } from "../bill-detail/review-status-banner";
import { BillPill } from "./bill-pill";
import { BillStatusBadge } from "./bill-status-badge";
import { BillTag } from "./bill-tag";

/**
 * 法案一覧（/bills）のカード。
 *
 * 既存の BillCard は画像が全幅上部、CompactBillCard は要約とタグを持たないため、
 * 一覧のデザイン（右のサムネ＋要約＋タグ）にどちらも合わない。既存のカードには
 * 手を入れず、バッジ・タグ・レビュー済み表示のプリミティブだけを組み合わせる。
 *
 * サムネイルは絶対配置ではなく flex の行にする。絶対配置だと本文側に
 * 「サムネ幅 + 右余白」を padding で空ける必要があり、狭い画面で本文が潰れる。
 * ふりがな表示で行数が伸びたときに空白の柱が残る問題も避けられる。
 *
 * タグと回答数だけはサムネの下でカード全幅に置く。左の段に押し込むと狭い画面で
 * チップが1つずつ折り返して縦に伸びる。
 */
export function BillSearchCard({ bill }: { bill: BillWithContent }) {
  const title = bill.bill_content?.title || bill.name;
  const summary = bill.bill_content?.summary;
  const reportCount = bill.publicReportCount ?? 0;
  const hasBadges =
    bill.tags.length > 0 || bill.hasPublicInterview || reportCount > 0;

  return (
    <Card className="overflow-hidden border border-black shadow-none transition-colors hover:bg-muted/50">
      <Link
        href={routes.billDetail(bill.id)}
        className="flex flex-col gap-2 p-4"
      >
        <div className="flex gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* タイトルは省略しない。何の法案かが読めないと選べない。 */}
            <h3 className="text-base font-bold leading-relaxed">
              {title}
              {bill.is_review_completed && (
                <>
                  {" "}
                  <ReviewCompleteBadge size={14} top="1px" />
                </>
              )}
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <BillStatusBadge status={bill.status} className="w-fit" />
              {bill.submitted_date && (
                <span className="text-xs font-medium text-mirai-text-muted">
                  {formatDateWithDots(bill.submitted_date)} 提出
                </span>
              )}
            </div>

            {summary && (
              <RubySafeLineClamp
                text={summary}
                lineClamp={2}
                className="text-xs leading-relaxed text-mirai-text-secondary"
              />
            )}
          </div>

          {bill.thumbnail_url && (
            <div className="relative h-16 w-24 shrink-0 self-start overflow-hidden rounded-lg sm:h-[90px] sm:w-[120px]">
              <Image
                src={bill.thumbnail_url}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 640px) 120px, 96px"
              />
            </div>
          )}
        </div>

        {hasBadges && (
          <div className="flex flex-wrap items-center gap-2">
            {bill.tags.map((tag) => (
              <BillTag key={tag.id} tag={tag} />
            ))}
            {bill.hasPublicInterview && (
              <BillPill>AIインタビュー受付中</BillPill>
            )}
            {/* 回答が集まっている議案だけ数字を出す。0人と書くと参加をためらわせる。 */}
            {reportCount > 0 && (
              <BillPill>💬 {reportCount}人がAIインタビューに回答</BillPill>
            )}
          </div>
        )}
      </Link>
    </Card>
  );
}
