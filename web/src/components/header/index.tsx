import { getDifficultyLevel } from "@/features/bill-difficulty/server/loaders/get-difficulty-level";
import { getDietSessions } from "@/features/diet-sessions/server/loaders/get-diet-sessions";
import { HeaderClient } from "./header-client";

export async function Header() {
  const [difficultyLevel, sessions] = await Promise.all([
    getDifficultyLevel(),
    getDietSessions(),
  ]);

  return <HeaderClient difficultyLevel={difficultyLevel} sessions={sessions} />;
}
