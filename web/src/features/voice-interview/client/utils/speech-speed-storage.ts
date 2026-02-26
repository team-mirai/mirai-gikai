export type SpeechSpeed = "slow" | "normal" | "fast";

const STORAGE_KEY = "voice-interview-speed";
const VALID_SPEEDS: SpeechSpeed[] = ["slow", "normal", "fast"];

export function getSpeechSpeed(): SpeechSpeed {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && VALID_SPEEDS.includes(value as SpeechSpeed)) {
      return value as SpeechSpeed;
    }
  } catch {
    // localStorage unavailable (SSR, private browsing, etc.)
  }
  return "normal";
}

export function setSpeechSpeed(speed: SpeechSpeed): void {
  try {
    localStorage.setItem(STORAGE_KEY, speed);
  } catch {
    // localStorage unavailable
  }
}
