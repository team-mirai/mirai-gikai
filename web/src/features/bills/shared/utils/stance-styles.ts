import type { MiraiStance } from "../types";
import { STANCE_LABELS } from "../types";

export type StanceStyles = {
  bg: string;
  border?: string;
  textColor: string;
  label: string;
};

/**
 * スタンスタイプに応じたスタイル（背景色・ボーダー色・テキスト色・ラベル）を返す
 */
export function getStanceStyles(
  stance: MiraiStance | undefined,
  isPreparing: boolean
): StanceStyles {
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
}
