import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { formatDateWithDots } from "@/lib/utils/date";
import type { BillWithContent } from "../../../shared/types";
import { ReviewCompleteBadge } from "../bill-detail/review-status-banner";
import { BillStatusBadge } from "./bill-status-badge";
import { BillTag } from "./bill-tag";

/**
 * 法案一覧（/bills）のカード。
 *
 * 既存の BillCard は画像が全幅上部、CompactBillCard は要約とタグを持たないため、
 * 一覧のデザイン（右上サムネ＋要約＋タグ）にどちらも合わない。既存のカードには
 * 手を入れず、バッジ・タグ・レビュー済み表示のプリミティブだけを組み合わせる。
 */
export function BillSearchCard({ bill }: { bill: BillWithContent }) {
  const title = bill.bill_content?.title || bill.name;
  const summary = bill.bill_content?.summary;

  return (
    <Card className="relative overflow-hidden rounded-xl border border-black p-0 shadow-none transition-colors hover:bg-muted/50">
      <Link href={routes.billDetail(bill.id)} className="block p-4">
        {bill.thumbnail_url && (
          <div className="absolute top-3 right-4 h-[90px] w-[120px] overflow-hidden rounded-lg">
            <Image
              src={bill.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {/* サムネイルと重ならないよう、テキスト側の幅を詰める */}
          <h3
            className={`line-clamp-2 text-base font-bold leading-relaxed ${
              bill.thumbnail_url ? "pr-[136px]" : ""
            }`}
          >
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
            <p
              className={`line-clamp-2 text-xs leading-relaxed text-mirai-text-secondary ${
                bill.thumbnail_url ? "pr-[136px]" : ""
              }`}
            >
              {summary}
            </p>
          )}

          {(bill.tags.length > 0 || bill.hasPublicInterview) && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {bill.tags.map((tag) => (
                <BillTag key={tag.id} tag={tag} />
              ))}
              {bill.hasPublicInterview && (
                <span className="inline-flex items-center justify-center rounded-full bg-mirai-light-gradient px-3 py-1 text-xs font-medium text-black">
                  AIインタビュー受付中
                </span>
              )}
              {/* 回答が集まっている議案だけ数字を出す。0人と書くと参加をためらわせる。 */}
              {(bill.publicReportCount ?? 0) > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-mirai-light-gradient px-3 py-1 text-xs font-medium text-black">
                  💬 {bill.publicReportCount}人がAIインタビューに回答
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
