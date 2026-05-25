import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerBillsTools } from "../../admin/src/features/mcp/server/tools/register-bills-tools";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestDietSession,
  cleanupTestTag,
  createTestBill,
  createTestBillContent,
  createTestBillTag,
  createTestDietSession,
  createTestTag,
} from "../supabase/utils";
import { createTestRegistry, type TestMcpRegistry } from "./utils";

describe("MCP bills tools", () => {
  let registry: TestMcpRegistry;
  const billIds: string[] = [];
  const tagIds: string[] = [];
  const dietSessionIds: string[] = [];

  beforeEach(() => {
    registry = createTestRegistry();
    registerBillsTools(registry.asMcpServer());
  });

  afterEach(async () => {
    for (const id of billIds.splice(0)) await cleanupTestBill(id);
    for (const id of tagIds.splice(0)) await cleanupTestTag(id);
    for (const id of dietSessionIds.splice(0)) await cleanupTestDietSession(id);
  });

  describe("list_bills", () => {
    it("publish_status / status でフィルタした議案を返す", async () => {
      const draftBill = await createTestBill({ publish_status: "draft" });
      const publishedBill = await createTestBill({
        publish_status: "published",
        status: "enacted",
      });
      billIds.push(draftBill.id, publishedBill.id);

      const draftResult = await registry.callTool<
        Array<{ id: string; publish_status: string }>
      >("list_bills", { publish_status: "draft" });
      const draftIds = draftResult.map((b) => b.id);
      expect(draftIds).toContain(draftBill.id);
      expect(draftIds).not.toContain(publishedBill.id);
      expect(draftResult.every((b) => b.publish_status === "draft")).toBe(true);

      const enactedResult = await registry.callTool<
        Array<{ id: string; status: string }>
      >("list_bills", { status: "enacted" });
      const enactedIds = enactedResult.map((b) => b.id);
      expect(enactedIds).toContain(publishedBill.id);
      expect(enactedIds).not.toContain(draftBill.id);
    });

    it("レスポンスに diet_sessions(name) が含まれる", async () => {
      const session = await createTestDietSession({
        name: `テスト会期-${Date.now()}`,
      });
      dietSessionIds.push(session.id);
      const bill = await createTestBill({ diet_session_id: session.id });
      billIds.push(bill.id);

      const result = await registry.callTool<
        Array<{ id: string; diet_sessions: { name: string } | null }>
      >("list_bills", {});
      const found = result.find((b) => b.id === bill.id);
      expect(found?.diet_sessions?.name).toBe(session.name);
    });
  });

  describe("get_bill", () => {
    it("bill本体・bill_contents・tagIds をまとめて返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });
      await createTestBillContent(bill.id, { difficulty_level: "hard" });
      const tag = await createTestTag();
      tagIds.push(tag.id);
      await createTestBillTag(bill.id, tag.id);

      const result = await registry.callTool<{
        bill: { id: string };
        contents: Array<{ difficulty_level: string }>;
        tagIds: string[];
      }>("get_bill", { billId: bill.id });

      expect(result.bill.id).toBe(bill.id);
      expect(result.contents).toHaveLength(2);
      expect(result.contents.map((c) => c.difficulty_level).sort()).toEqual([
        "hard",
        "normal",
      ]);
      expect(result.tagIds).toEqual([tag.id]);
    });

    it("該当する議案が無いと例外を投げる", async () => {
      await expect(
        registry.callTool("get_bill", {
          billId: "00000000-0000-0000-0000-000000000000",
        })
      ).rejects.toThrow();
    });
  });

  describe("get_bill_by_slug", () => {
    it("slug で議案を引ける", async () => {
      const bill = await createTestBill({ name: "slug検索用" });
      billIds.push(bill.id);
      const slug = `test-slug-${bill.id.slice(0, 8)}-${Date.now()}`;
      await adminClient.from("bills").update({ slug }).eq("id", bill.id);

      const result = await registry.callTool<{
        bill: { id: string; slug: string };
      }>("get_bill_by_slug", { slug });
      expect(result.bill.id).toBe(bill.id);
      expect(result.bill.slug).toBe(slug);
    });

    it("該当する議案が無いと例外を投げる", async () => {
      await expect(
        registry.callTool("get_bill_by_slug", {
          slug: `non-existent-${Date.now()}`,
        })
      ).rejects.toThrow();
    });
  });

  describe("create_bill", () => {
    it("submitted_date が指定されると日本時刻 ISO に変換して保存する", async () => {
      const result = await registry.callTool<{
        ok: boolean;
        bill: { id: string };
      }>("create_bill", {
        name: `MCP作成テスト-${Date.now()}`,
        status: "introduced",
        originating_house: "HR",
        status_note: null,
        submitted_date: "2025-04-01",
        is_featured: false,
        is_review_completed: false,
        knowledge_source: "",
        use_knowledge_source_in_chat: false,
      });

      expect(result.ok).toBe(true);
      billIds.push(result.bill.id);

      const { data } = await adminClient
        .from("bills")
        .select("submitted_date")
        .eq("id", result.bill.id)
        .single();
      // Postgres は timestamptz を UTC 正規化して返すため、瞬間時刻として比較する。
      expect(new Date(data?.submitted_date ?? "").toISOString()).toBe(
        new Date("2025-04-01T00:00:00+09:00").toISOString()
      );
    });

    it("submitted_date が空文字の場合は null として保存する", async () => {
      const result = await registry.callTool<{
        ok: boolean;
        bill: { id: string };
      }>("create_bill", {
        name: `MCP作成テスト空-${Date.now()}`,
        status: "introduced",
        originating_house: "HR",
        status_note: null,
        submitted_date: "",
        is_featured: false,
        is_review_completed: false,
        knowledge_source: "",
        use_knowledge_source_in_chat: false,
      });
      billIds.push(result.bill.id);

      const { data } = await adminClient
        .from("bills")
        .select("submitted_date")
        .eq("id", result.bill.id)
        .single();
      expect(data?.submitted_date).toBeNull();
    });

    it("knowledge_source / use_knowledge_source_in_chat を省略しても作成できる", async () => {
      const result = await registry.callTool<{
        ok: boolean;
        bill: { id: string };
      }>("create_bill", {
        name: `MCP作成テスト省略-${Date.now()}`,
        status: "introduced",
        originating_house: "HR",
        status_note: null,
        is_featured: false,
        is_review_completed: false,
      });
      expect(result.ok).toBe(true);
      billIds.push(result.bill.id);

      const { data } = await adminClient
        .from("bills")
        .select("knowledge_source, use_knowledge_source_in_chat")
        .eq("id", result.bill.id)
        .single();
      // 省略時は DB のデフォルト（NULL / false）が入る
      expect(data?.knowledge_source).toBeNull();
      expect(data?.use_knowledge_source_in_chat).toBe(false);
    });
  });

  describe("update_bill", () => {
    it("name と status を更新する", async () => {
      const bill = await createTestBill({ name: "更新前" });
      billIds.push(bill.id);

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
        name: "更新後",
        status: "enacted",
        originating_house: "HC",
        status_note: null,
        is_featured: false,
        is_review_completed: true,
        knowledge_source: "",
        use_knowledge_source_in_chat: false,
      });
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select("name, status, originating_house, is_review_completed")
        .eq("id", bill.id)
        .single();
      expect(data?.name).toBe("更新後");
      expect(data?.status).toBe("enacted");
      expect(data?.originating_house).toBe("HC");
      expect(data?.is_review_completed).toBe(true);
    });

    it("billId 以外を省略すると updated_at だけが更新される", async () => {
      const bill = await createTestBill({
        name: "部分更新元",
        status: "introduced",
        originating_house: "HR",
      });
      billIds.push(bill.id);

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
      });
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select("name, status, originating_house")
        .eq("id", bill.id)
        .single();
      expect(data?.name).toBe("部分更新元");
      expect(data?.status).toBe("introduced");
      expect(data?.originating_house).toBe("HR");
    });

    it("一部のフィールドのみ指定した場合、他のフィールドは変更されない", async () => {
      const bill = await createTestBill({
        name: "更新前の名前",
        status: "introduced",
        originating_house: "HR",
        is_featured: false,
      });
      billIds.push(bill.id);
      await adminClient
        .from("bills")
        .update({
          submitted_date: "2025-04-01T00:00:00+09:00",
          status_note: "初期備考",
        })
        .eq("id", bill.id);

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
        name: "更新後の名前のみ",
      });
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select(
          "name, status, originating_house, is_featured, submitted_date, status_note"
        )
        .eq("id", bill.id)
        .single();
      expect(data?.name).toBe("更新後の名前のみ");
      expect(data?.status).toBe("introduced");
      expect(data?.originating_house).toBe("HR");
      expect(data?.is_featured).toBe(false);
      expect(data?.status_note).toBe("初期備考");
      expect(new Date(data?.submitted_date ?? "").toISOString()).toBe(
        new Date("2025-04-01T00:00:00+09:00").toISOString()
      );
    });

    it("submitted_date に空文字を指定すると null に更新される", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await adminClient
        .from("bills")
        .update({ submitted_date: "2025-04-01T00:00:00+09:00" })
        .eq("id", bill.id);

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
        submitted_date: "",
      });
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select("submitted_date")
        .eq("id", bill.id)
        .single();
      expect(data?.submitted_date).toBeNull();
    });

    it("knowledge_source / use_knowledge_source_in_chat を省略しても更新できる", async () => {
      const bill = await createTestBill({ name: "ナレッジ無し更新前" });
      billIds.push(bill.id);
      // 既存値を持たせておき、省略しても上書きされない（または DB デフォルト挙動）を確認する
      await adminClient
        .from("bills")
        .update({
          knowledge_source: "既存ナレッジ",
          use_knowledge_source_in_chat: true,
        })
        .eq("id", bill.id);

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
        name: "ナレッジ無し更新後",
        status: "introduced",
        originating_house: "HR",
        status_note: null,
        is_featured: false,
        is_review_completed: false,
      });
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select("name")
        .eq("id", bill.id)
        .single();
      expect(data?.name).toBe("ナレッジ無し更新後");
    });

    it("status を enacted に変更すると、紐づく公開中インタビューが自動で closed になる", async () => {
      const bill = await createTestBill({ name: "成立前" });
      billIds.push(bill.id);

      const { data: config, error: configError } = await adminClient
        .from("interview_configs")
        .insert({
          bill_id: bill.id,
          status: "public",
          name: "公開中インタビュー",
        })
        .select()
        .single();
      if (configError || !config) {
        throw new Error(`interview_config 作成失敗: ${configError?.message}`);
      }

      const result = await registry.callTool<{ ok: boolean }>("update_bill", {
        billId: bill.id,
        name: "成立後",
        status: "enacted",
        originating_house: "HR",
        status_note: null,
        is_featured: false,
        is_review_completed: true,
      });
      expect(result.ok).toBe(true);

      const { data: updatedConfig } = await adminClient
        .from("interview_configs")
        .select("status")
        .eq("id", config.id)
        .single();
      expect(updatedConfig?.status).toBe("closed");
    });
  });

  describe("update_bill_publish_status", () => {
    it("publish_status を変更する", async () => {
      const bill = await createTestBill({ publish_status: "draft" });
      billIds.push(bill.id);

      const result = await registry.callTool<{ ok: boolean }>(
        "update_bill_publish_status",
        { billId: bill.id, publishStatus: "published" }
      );
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bills")
        .select("publish_status")
        .eq("id", bill.id)
        .single();
      expect(data?.publish_status).toBe("published");
    });
  });

  describe("update_bill_contents", () => {
    it("normal / hard 両方を upsert する", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await registry.callTool<{ ok: boolean }>(
        "update_bill_contents",
        {
          billId: bill.id,
          normal: {
            title: "ふつうタイトル",
            summary: "ふつう要約",
            content: "ふつう本文",
          },
          hard: {
            title: "難しいタイトル",
            summary: "難しい要約",
            content: "難しい本文",
          },
        }
      );
      expect(result.ok).toBe(true);

      const { data } = await adminClient
        .from("bill_contents")
        .select("difficulty_level, title, summary, content")
        .eq("bill_id", bill.id)
        .order("difficulty_level");
      expect(data).toHaveLength(2);
      const hard = data?.find((c) => c.difficulty_level === "hard");
      const normal = data?.find((c) => c.difficulty_level === "normal");
      expect(normal?.title).toBe("ふつうタイトル");
      expect(hard?.summary).toBe("難しい要約");
    });

    it("title/summary/content がすべて空の難易度はスキップする", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      await registry.callTool("update_bill_contents", {
        billId: bill.id,
        normal: { title: "", summary: "", content: "" },
        hard: { title: "難しい", summary: "", content: "" },
      });

      const { data } = await adminClient
        .from("bill_contents")
        .select("difficulty_level")
        .eq("bill_id", bill.id);
      expect(data).toHaveLength(1);
      expect(data?.[0]?.difficulty_level).toBe("hard");
    });

    it("既存レコードがあれば onConflict で上書きする", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "古い",
      });

      await registry.callTool("update_bill_contents", {
        billId: bill.id,
        normal: { title: "新しい", summary: "新要約", content: "新本文" },
        hard: { title: "", summary: "", content: "" },
      });

      const { data } = await adminClient
        .from("bill_contents")
        .select("title")
        .eq("bill_id", bill.id)
        .eq("difficulty_level", "normal")
        .single();
      expect(data?.title).toBe("新しい");
    });
  });

  describe("update_bill_tags", () => {
    it("既存タグとの差分のみ insert/delete し、added/removed を返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      const tagA = await createTestTag();
      const tagB = await createTestTag();
      const tagC = await createTestTag();
      tagIds.push(tagA.id, tagB.id, tagC.id);

      // 初期: A, B
      await createTestBillTag(bill.id, tagA.id);
      await createTestBillTag(bill.id, tagB.id);

      // A は維持、B を削除、C を追加
      const result = await registry.callTool<{
        ok: boolean;
        added: string[];
        removed: string[];
      }>("update_bill_tags", {
        billId: bill.id,
        tagIds: [tagA.id, tagC.id],
      });

      expect(result.ok).toBe(true);
      expect(result.added).toEqual([tagC.id]);
      expect(result.removed).toEqual([tagB.id]);

      const { data } = await adminClient
        .from("bills_tags")
        .select("tag_id")
        .eq("bill_id", bill.id);
      const ids = (data ?? []).map((d) => d.tag_id).sort();
      expect(ids).toEqual([tagA.id, tagC.id].sort());
    });

    it("差分が無い場合は added/removed が共に空", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      const tag = await createTestTag();
      tagIds.push(tag.id);
      await createTestBillTag(bill.id, tag.id);

      const result = await registry.callTool<{
        added: string[];
        removed: string[];
      }>("update_bill_tags", { billId: bill.id, tagIds: [tag.id] });
      expect(result.added).toEqual([]);
      expect(result.removed).toEqual([]);
    });
  });

  it("登録されているツール名が想定通り", () => {
    expect(registry.toolNames().sort()).toEqual(
      [
        "list_bills",
        "get_bill",
        "get_bill_by_slug",
        "create_bill",
        "update_bill",
        "update_bill_publish_status",
        "update_bill_contents",
        "update_bill_tags",
      ].sort()
    );
  });
});
