import Image from "next/image";
import type { ReactNode } from "react";
import type { BillStatusEnum, MiraiStance } from "../../../shared/types";
import { getStanceStyles } from "../../../shared/utils/stance-styles";
import { StanceComment, StanceReason } from "./stance-reason";

interface MiraiStanceCardProps {
  stance: MiraiStance;
  billStatus?: BillStatusEnum;
  /** 判断の理由の下に区切り線を挟んで出す内容（賛否に関連する動画など） */
  children?: ReactNode;
}

export function MiraiStanceCard({
  stance,
  billStatus,
  children,
}: MiraiStanceCardProps) {
  // 法案提出前の場合は専用のスタイルを使用
  const isPreparing = billStatus === "preparing";

  const styles = getStanceStyles(stance, isPreparing);

  return (
    <>
      <h2 className="text-[22px] font-bold mb-4">🗳️チームみらいの賛否</h2>
      <div className="relative p-1 rounded-2xl bg-mirai-gradient">
        <div className="bg-white rounded-lg px-6 pb-8 pt-10">
          <div className="flex flex-col gap-8">
            {/* ヘッダー部分：ロゴとスタンスバッジ */}
            <div className="flex flex-col items-center gap-8">
              {/* チームみらいロゴ */}
              <div className="relative w-37 h-31">
                <Image
                  src="/img/logo.svg"
                  alt="チームみらい"
                  fill
                  className="object-contain"
                />
              </div>

              {/* スタンスバッジ */}
              <div
                className={`w-full py-4 ${styles.bg} ${styles.border ? `border ${styles.border}` : ""} rounded-lg flex justify-center items-center`}
              >
                <span className={`${styles.textColor} text-xl font-bold`}>
                  {styles.label}
                </span>
              </div>
            </div>

            {/* 判断の理由 */}
            {isPreparing ? (
              <StanceComment comment="法案提出後、党内で検討のうえ賛否を表明します。" />
            ) : (
              <StanceReason stance={stance} />
            )}

            {/* 法案提出前は賛否の中身を出さないため、関連する内容も出さない */}
            {!isPreparing && children && (
              <div className="border-t border-mirai-border pt-8">
                {children}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
