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
      border: "border-mirai-text-muted",
      textColor: "text-mirai-text-muted",
      label: "法案提出前",
    };
  }

  switch (stance?.type) {
    case "for":
    case "conditional_for":
      return {
        bg: "bg-stance-for-bg",
        textColor: "text-primary-accent",
        label: STANCE_LABELS[stance.type],
      };
    case "against":
    case "conditional_against":
      return {
        bg: "bg-stance-against-bg",
        textColor: "text-stance-against",
        label: STANCE_LABELS[stance.type],
      };
    default:
      return {
        bg: "bg-mirai-surface-muted",
        textColor: "text-black",
        label: stance != null ? STANCE_LABELS[stance.type] : "中立",
      };
  }
}
