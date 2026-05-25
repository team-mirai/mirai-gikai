import type { InterviewConfig } from "../types";

export function getModeLabel(mode: InterviewConfig["mode"]): string {
  switch (mode) {
    case "loop":
      return "ループ";
    case "bulk":
      return "一括";
    case "targeted":
      return "ターゲット";
    default:
      return mode;
  }
}
