import "server-only";

import {
  invalidateWebCache,
  WEB_CACHE_TAGS,
} from "@/lib/utils/cache-invalidation";

export async function invalidateBillsCache() {
  await invalidateWebCache([WEB_CACHE_TAGS.BILLS]);
}
