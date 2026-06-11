import { runAnalysis } from "@mirai-gikai/topic-analysis-core/analyze";
import { runBackfill } from "@mirai-gikai/topic-analysis-core/backfill";
import { resolveBackfillParams } from "@mirai-gikai/topic-analysis-core/backfill-params";

/**
 * Cloud Run Job のエントリポイント。
 *
 * 起動例:
 *   tsx src/main.ts --mode=analyze --bill-id=<uuid> --version-id=<uuid>
 *   tsx src/main.ts --mode=backfill                              # 未再抽出を全議案で処理
 *   tsx src/main.ts --mode=backfill --bill-id=<uuid>             # 指定議案の未再抽出のみ
 *   tsx src/main.ts --mode=backfill --bill-id=<uuid> --scope=all # 指定議案を全件やり直し
 *   tsx src/main.ts --mode=backfill --model=openai/gpt-5.2       # 使用モデルを指定（省略時は既定）
 *
 * 必須env: SUPABASE_URL, SUPABASE_SECRET_KEY, AI_GATEWAY_API_KEY
 */

type Mode = "analyze" | "backfill";

/** `--key=value` 形式の引数だけをパースする（Cloud Run の --args 渡しに合わせる）。 */
function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode as Mode | undefined;

  // 接続情報が無ければ即座に失敗させる（部分実行を避ける）。
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_SECRET_KEY");
  requireEnv("AI_GATEWAY_API_KEY");

  if (mode === "analyze") {
    const versionId = args["version-id"];
    const billId = args["bill-id"];
    if (!versionId || !billId) {
      throw new Error(
        "analyze mode requires --version-id=<uuid> and --bill-id=<uuid>"
      );
    }
    await runAnalysis(versionId, billId);
    return;
  }

  if (mode === "backfill") {
    const resolved = resolveBackfillParams({
      billId: args["bill-id"],
      scope: args.scope,
      model: args.model,
    });
    if (!resolved.ok) {
      throw new Error(`backfill mode: ${resolved.error}`);
    }
    await runBackfill(resolved.params);
    return;
  }

  throw new Error(
    `Unknown --mode=${mode ?? "(none)"} (expected "analyze" or "backfill")`
  );
}

main()
  .then(() => {
    console.log("[worker] done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[worker] failed:", error);
    process.exit(1);
  });
