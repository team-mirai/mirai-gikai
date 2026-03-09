import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ALL_CACHE_TAGS, type CacheTag } from "@/lib/cache-tags";
import { env } from "@/lib/env";

export async function POST(request: NextRequest) {
  try {
    // Authorization header check
    const authHeader = request.headers.get("authorization");

    if (!env.revalidateSecret) {
      return NextResponse.json(
        { error: "Revalidation secret not configured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${env.revalidateSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // tagsが指定されていれば対象のみ、なければ全タグを無効化
    const body = await request.json().catch(() => null);
    const requestedTags: CacheTag[] =
      body?.tags && Array.isArray(body.tags) ? body.tags : ALL_CACHE_TAGS;

    const revalidatedTags: string[] = [];
    for (const tag of requestedTags) {
      if ((ALL_CACHE_TAGS as readonly string[]).includes(tag)) {
        revalidateTag(tag);
        revalidatedTags.push(tag);
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      tags: revalidatedTags,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
