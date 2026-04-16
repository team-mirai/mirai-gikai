import type { InterviewConfig } from "../types";

export function getModeLabel(mode: InterviewConfig["mode"]): string {
  switch (mode) {
    case "loop":
      return "ループ";
    case "bulk":
      return "一括";
    default:
      return mode;
  }
}
