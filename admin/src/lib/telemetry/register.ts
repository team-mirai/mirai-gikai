import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseExporter } from "langfuse-vercel";
import { env } from "@/lib/env";

let isInitialized = false;

/**
 * Langfuse telemetryを初期化する
 * Vercel環境ではinstrumentation.node.tsが自動起動しないため、
 * 必要な箇所で明示的に呼び出す
 */
export async function registerNodeTelemetry() {
  if (isInitialized) {
    return;
  }

  try {
    const { publicKey, secretKey, baseUrl } = env.langfuse;

    if (!publicKey || !secretKey) {
      console.warn(
        "[Telemetry] Langfuse credentials not configured. Telemetry disabled."
      );
      return;
    }

    const langfuseExporter = new LangfuseExporter({
      publicKey,
      secretKey,
      baseUrl,
      environment: process.env.VERCEL_ENV || "development",
    });

    const sdk = new NodeSDK({
      traceExporter: langfuseExporter,
    });

    sdk.start();
    isInitialized = true;
  } catch (error) {
    console.error("[Telemetry] Failed to initialize Langfuse:", error);
  }
}
