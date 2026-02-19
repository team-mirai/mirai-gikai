import { createBrowserClient } from "@mirai-gikai/supabase";

export interface UploadResult {
  url?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * サムネイル画像をSupabase Storageにアップロード
 */
export async function uploadThumbnail(
  file: File,
  billId?: string,
  storagePrefix?: string
): Promise<UploadResult> {
  const supabase = createBrowserClient();

  // ファイル形式チェック
  if (!file.type.startsWith("image/")) {
    return { error: "画像ファイルを選択してください" };
  }

  // ファイルサイズチェック (5MB以下)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "ファイルサイズは5MB以下にしてください" };
  }

  try {
    // 新しいファイル名を生成
    const fileExt = file.name.split(".").pop();
    const prefix = storagePrefix ? `${storagePrefix}_` : "";
    const fileName = `${prefix}${billId || "new"}_${Date.now()}.${fileExt}`;

    // ファイルをアップロード
    const { data, error } = await supabase.storage
      .from("bill-thumbnails")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return { error: "アップロードに失敗しました" };
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from("bill-thumbnails")
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { error: "アップロードに失敗しました" };
  }
}

/**
 * サムネイル画像をSupabase Storageから削除
 */
export async function deleteThumbnail(url: string): Promise<DeleteResult> {
  const supabase = createBrowserClient();

  try {
    const fileName = url.split("/").pop();
    if (!fileName) {
      return { success: false, error: "ファイル名が取得できません" };
    }

    const { error } = await supabase.storage
      .from("bill-thumbnails")
      .remove([fileName]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: "削除に失敗しました" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: "削除に失敗しました" };
  }
}
