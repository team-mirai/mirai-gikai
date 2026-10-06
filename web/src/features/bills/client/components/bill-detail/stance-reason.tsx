import {
  getDisplayableSupplements,
  getNewFormatReason,
} from "@mirai-gikai/shared/mirai-stance/reason-format";
import type { MiraiStance } from "../../../shared/types";
import { StanceSupplementBody } from "./stance-supplement-body";
import { StanceSupplements } from "./stance-supplements";

interface StanceReasonProps {
  stance: MiraiStance;
}

/**
 * 判断の理由。新フォーマット（一言 + 箇条書き + 補足情報）のデータがあればそちらを、
 * なければ旧フォーマットのコメントを表示する。
 */
export function StanceReason({ stance }: StanceReasonProps) {
  const reason = getNewFormatReason(stance);
  if (!reason) {
    return stance.comment != null ? (
      <StanceComment comment={stance.comment} />
    ) : null;
  }

  const supplements = getDisplayableSupplements(stance.supplements);

  return (
    <>
      <div className="flex flex-col gap-2">
        {reason.summary && (
          <p className="text-base font-bold leading-relaxed whitespace-pre-wrap text-pretty">
            {reason.summary}
          </p>
        )}
        {reason.points.length > 0 && (
          <ul className="mt-1 flex list-disc flex-col gap-2 pl-[1.2em]">
            {reason.points.map((point, index) => (
              // 箇条書きは並び順が意味を持ち、同じ文言が重複し得るため index を key にする
              // biome-ignore lint/suspicious/noArrayIndexKey: 上記の理由
              <li key={index} className="text-base font-medium leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 補足情報がない法案では開閉ボタン自体を出さない */}
      {supplements.length > 0 && (
        <StanceSupplements>
          {supplements.map((supplement, index) => (
            <section
              // biome-ignore lint/suspicious/noArrayIndexKey: 補足情報は見出しが重複・空になり得るため
              key={index}
              className="flex flex-col gap-2.5 rounded-xl bg-mirai-surface-grouped p-4"
            >
              {supplement.title && (
                <h4 className="text-sm font-bold">{supplement.title}</h4>
              )}
              <StanceSupplementBody markdown={supplement.body} />
            </section>
          ))}
        </StanceSupplements>
      )}
    </>
  );
}

/** 旧フォーマットのコメント・理由 */
export function StanceComment({ comment }: { comment: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-bold">コメント・理由</h3>
      <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
        {comment}
      </p>
    </div>
  );
}
