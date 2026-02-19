import type { DietSession } from "../../shared/types";
import { findAllDietSessions } from "../repositories/diet-session-repository";

export async function loadDietSessions(): Promise<DietSession[]> {
  const data = await findAllDietSessions();
  return data || [];
}
