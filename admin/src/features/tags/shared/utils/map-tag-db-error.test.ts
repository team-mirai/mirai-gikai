import { describe, expect, it } from "vitest";
import { mapTagDbError } from "./map-tag-db-error";

describe("mapTagDbError", () => {
  it("23505コード（UNIQUE制約違反）で重複メッセージを返す", () => {
    const error = { code: "23505", message: "duplicate key value" };
    expect(mapTagDbError(error, "作成")).toBe("このタグ名は既に存在します");
    expect(mapTagDbError(error, "更新")).toBe("このタグ名は既に存在します");
    expect(mapTagDbError(error, "削除")).toBe("このタグ名は既に存在します");
  });

  it("PGRST116コード（レコードなし）で見つからないメッセージを返す", () => {
    const error = { code: "PGRST116", message: "not found" };
    expect(mapTagDbError(error, "更新")).toBe("タグが見つかりません");
    expect(mapTagDbError(error, "削除")).toBe("タグが見つかりません");
  });

  it("未知のエラーコードでは操作名付きの汎用メッセージを返す", () => {
    const error = { code: "42501", message: "permission denied" };
    expect(mapTagDbError(error, "作成")).toBe(
      "タグの作成に失敗しました: permission denied"
    );
    expect(mapTagDbError(error, "更新")).toBe(
      "タグの更新に失敗しました: permission denied"
    );
    expect(mapTagDbError(error, "削除")).toBe(
      "タグの削除に失敗しました: permission denied"
    );
  });
});
