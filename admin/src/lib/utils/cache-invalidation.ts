import { env } from "../env";
import { logger } from "../logger";

/**
 * Invalidate all caches in the web application
 */
export async function invalidateWebCache(): Promise<void> {
  if (!env.webUrl || !env.revalidateSecret) {
    console.warn(
      "Web URL or revalidate secret not configured, skipping cache invalidation"
    );
    return;
  }

  try {
    const response = await fetch(`${env.webUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.revalidateSecret}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cache invalidation failed: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();
    logger.debug("Cache invalidated successfully:", result);
  } catch (error) {
    console.error("Failed to invalidate web cache:", error);
    // Don't throw error to prevent breaking the main operation
  }
}
