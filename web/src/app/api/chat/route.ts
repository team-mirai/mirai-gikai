import { jsonResponse } from "@/lib/api/response";

export async function POST() {
  return jsonResponse(
    { error: "AIチャット機能はこのサイトでは利用できません" },
    404
  );
}
