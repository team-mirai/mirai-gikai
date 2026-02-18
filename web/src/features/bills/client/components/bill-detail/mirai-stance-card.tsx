import Image from "next/image";
import type { BillStatusEnum, MiraiStance } from "../../../shared/types";
import { STANCE_LABELS } from "../../../shared/types";

interface MiraiStanceCardProps {
  stance?: MiraiStance;
  billStatus?: BillStatusEnum;
}

export function MiraiStanceCard({ stance, billStatus }: MiraiStanceCardProps) {
  // 法案提出前の場合は専用のスタイルを使用
  const isPreparing = billStatus === "preparing";

  if (!stance && !isPreparing) {
    return null; // スタンスがなく、法案提出前でもない場合は何も表示しない
  }

  // スタンスタイプに応じた背景色とボーダー色を設定
  const getStanceStyles = () => {
    if (isPreparing) {
      return {
        bg: "bg-white",
        border: "border-[#8E8E93]",
        textColor: "text-[#8E8E93]",
        label: "法案提出前",
      };
    }

    switch (stance?.type) {
      case "for":
      case "conditional_for":
        return {
          bg: "bg-[#ECFCF1]",
          textColor: "text-[#0F8472]",
          label: STANCE_LABELS[stance.type],
        };
      case "against":
      case "conditional_against":
        return {
          bg: "bg-[#FFF1F1]",
          textColor: "text-[#C9272A]",
          label: STANCE_LABELS[stance.type],
        };
      default:
        return {
          bg: "bg-[#E5E5EA]",
          textColor: "text-black",
          label: stance != null ? STANCE_LABELS[stance.type] : "中立",
        };
    }
  };

  const styles = getStanceStyles();
  const comment = isPreparing
    ? "法案提出後に賛否を表明します。"
    : stance?.comment;

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

            {/* コメント部分 */}
            {comment != null && (
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold">コメント・理由</h3>
                <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">
                  {comment}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
