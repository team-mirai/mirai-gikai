import { requireAdmin } from "@/features/auth/server/lib/auth-server";
import { renderShareImage } from "@/features/bills-edit/server/utils/render-share-image";
import { parseShareImageInput } from "@/features/bills-edit/shared/utils/share-image";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const input = parseShareImageInput({
    title: searchParams.get("title"),
    photoUrl: searchParams.get("photoUrl"),
    supabaseUrl: env.supabaseUrl,
    requirePhoto: false,
  });
  if (!input.ok) {
    return new Response(input.error, { status: 400 });
  }

  try {
    const image = await renderShareImage(input);
    return new Response(await image.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[BillShareImage] Render failed:", error);
    return new Response("Failed to render image", { status: 500 });
  }
}
