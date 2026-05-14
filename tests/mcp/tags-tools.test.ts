import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerTagsTools } from "../../admin/src/features/mcp/server/tools/register-tags-tools";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestTag,
  createTestBill,
  createTestBillTag,
  createTestTag,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP tags tools", () => {
  let registry: TestMcpRegistry;
  const tagIds: string[] = [];
  const billIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerTagsTools(registry.asMcpServer());
  });

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
    for (const id of tagIds.splice(0)) await cleanupTestTag(id);
  });

  describe("list_tags", () => {
    it("タグ一覧と紐づく議案数(bill_count)を返す", async () => {
      const tag = await createTestTag();
      tagIds.push(tag.id);
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestBillTag(bill.id, tag.id);

      const result =
        await registry.callTool<
          Array<{
            id: string;
            label: string;
            bills_tags: Array<{ count: number }>;
          }>
        >("list_tags");
      const found = result.find((t) => t.id === tag.id);
      expect(found).toBeTruthy();
      expect(found?.label).toBe(tag.label);
      expect(found?.bills_tags?.[0]?.count).toBe(1);
    });
  });

  describe("create_tag", () => {
    it("label のみで作成できる", async () => {
      const label = `mcp-tag-${Date.now()}`;
      const result = await registry.callTool<{
        ok: boolean;
        tag: { id: string; label: string; description: string | null };
      }>("create_tag", { label });
      expect(result.ok).toBe(true);
      expect(result.tag.label).toBe(label);
      expect(result.tag.description).toBeNull();
      tagIds.push(result.tag.id);
    });

    it("description / featured_priority も保存できる", async () => {
      const label = `mcp-tag-meta-${Date.now()}`;
      const result = await registry.callTool<{
        ok: boolean;
        tag: {
          id: string;
          description: string | null;
          featured_priority: number | null;
        };
      }>("create_tag", {
        label,
        description: "説明文",
        featured_priority: 5,
      });
      expect(result.ok).toBe(true);
      expect(result.tag.description).toBe("説明文");
      expect(result.tag.featured_priority).toBe(5);
      tagIds.push(result.tag.id);
    });

    it("label の前後空白は trim される", async () => {
      const base = `mcp-trim-${Date.now()}`;
      const result = await registry.callTool<{
        ok: boolean;
        tag: { id: string; label: string };
      }>("create_tag", { label: `  ${base}  ` });
      expect(result.tag.label).toBe(base);
      tagIds.push(result.tag.id);
    });

    it("label が空白のみの場合はエラーメッセージを返す", async () => {
      const result = await registry.callTool<{
        ok: boolean;
        error?: string;
      }>("create_tag", { label: "   " });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("タグ名を入力してください");
    });

    it("重複した label は 23505 を日本語化したエラーを返す", async () => {
      const tag = await createTestTag();
      tagIds.push(tag.id);

      const result = await registry.callTool<{
        ok: boolean;
        error?: string;
      }>("create_tag", { label: tag.label });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("このタグ名は既に存在します");
    });
  });

  describe("update_tag", () => {
    it("label / description / featured_priority を更新する", async () => {
      const tag = await createTestTag();
      tagIds.push(tag.id);
      const newLabel = `updated-${Date.now()}`;

      const result = await registry.callTool<{
        ok: boolean;
        tag: {
          label: string;
          description: string | null;
          featured_priority: number | null;
        };
      }>("update_tag", {
        id: tag.id,
        label: newLabel,
        description: "新説明",
        featured_priority: 3,
      });
      expect(result.ok).toBe(true);
      expect(result.tag.label).toBe(newLabel);
      expect(result.tag.description).toBe("新説明");
      expect(result.tag.featured_priority).toBe(3);

      const { data } = await adminClient
        .from("tags")
        .select("label, description, featured_priority")
        .eq("id", tag.id)
        .single();
      expect(data?.label).toBe(newLabel);
      expect(data?.featured_priority).toBe(3);
    });

    it("label が空白のみの場合はエラーメッセージを返す", async () => {
      const tag = await createTestTag();
      tagIds.push(tag.id);

      const result = await registry.callTool<{
        ok: boolean;
        error?: string;
      }>("update_tag", { id: tag.id, label: "   " });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("タグ名を入力してください");
    });

    it("存在しないIDだと PGRST116 を日本語化したエラーを返す", async () => {
      const result = await registry.callTool<{
        ok: boolean;
        error?: string;
      }>("update_tag", {
        id: "00000000-0000-0000-0000-000000000000",
        label: "存在しない更新",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBe("タグが見つかりません");
    });
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames().sort()).toEqual(
      ["list_tags", "create_tag", "update_tag"].sort()
    );
  });
});
