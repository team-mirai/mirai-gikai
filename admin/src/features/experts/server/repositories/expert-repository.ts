import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";

export async function findExpertRegistrations() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("expert_registrations")
    .select("id, name, email, affiliation, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch expert registrations: ${error.message}`);
  }
  return data;
}
