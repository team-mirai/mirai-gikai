# Repository レイヤー設計方針

Supabase への直接アクセスは `server/repositories/` に集約し、loaders/actions/services からは repository 関数を呼び出します。

## 基本パターン

```typescript
// server/repositories/{feature}-repository.ts
import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";

export async function findBillById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    throw new Error(`Failed to fetch bill: ${error.message}`);
  }
  return data;
}
```

## ルール

- **`import "server-only"`** を必ず先頭に付与
- **`createAdminClient()`** の呼び出しは repository 内に閉じ込め、loaders/actions/services からは直接呼ばない
- repository 関数は「Supabase クエリ実行 + エラーハンドリング」のみを担当し、ビジネスロジック（キャッシュ制御、認証チェック、データ変換等）は呼び出し元に残す
- 関数名は操作に応じて `find*` / `create*` / `update*` / `delete*` で統一
- クライアント側の Supabase 呼び出し（`createBrowserClient` を使う認証・Storage 操作等）は repository の対象外
