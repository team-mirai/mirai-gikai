import "server-only";

import { createAdminClient } from "@mirai-gikai/supabase";
import type { StanceInput } from "../types";

export async function findStanceByBillId(billId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("mirai_stances")
    .select("*")
    .eq("bill_id", billId)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      throw new Error(`Failed to fetch stance: ${error.message}`);
    }
    return null;
  }

  return data;
}

export async function createMiraiStance(billId: string, input: StanceInput) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("mirai_stances").insert({
    bill_id: billId,
    type: input.type,
    comment: input.comment || null,
  });

  if (error) {
    throw new Error(`Failed to create stance: ${error.message}`);
  }
}

export async function updateMiraiStance(stanceId: string, input: StanceInput) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mirai_stances")
    .update({
      type: input.type,
      comment: input.comment || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stanceId);

  if (error) {
    throw new Error(`Failed to update stance: ${error.message}`);
  }
}

export async function deleteMiraiStance(stanceId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("mirai_stances")
    .delete()
    .eq("id", stanceId);

  if (error) {
    throw new Error(`Failed to delete stance: ${error.message}`);
  }
}
