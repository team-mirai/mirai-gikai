import { describe, it, expect, afterEach } from "vitest";
import {
  createTestBill,
  cleanupTestBill,
  createTestBillContent,
  createTestTag,
  cleanupTestTag,
  createTestBillTag,
  createTestMiraiStance,
  createTestPreviewToken,
  createTestDietSession,
  cleanupTestDietSession,
} from "@test-utils/utils";
import {
  findPublishedBillsWithContents,
  findPublishedBillById,
  findBillById,
  findMiraiStanceByBillId,
  findTagsByBillId,
  findBillContentByDifficulty,
  findTagsByBillIds,
  findPublishedBillsByDietSession,
  findPreviousSessionBills,
  countPublishedBillsByDietSession,
  findFeaturedTags,
  findPublishedBillsByTag,
  findFeaturedBillsWithContents,
  findComingSoonBills,
  findPreviewToken,
} from "./bill-repository";

describe("bill-repository 統合テスト", () => {
  const billIds: string[] = [];
  const tagIds: string[] = [];
  const dietSessionIds: string[] = [];

  afterEach(async () => {
    for (const billId of billIds) {
      await cleanupTestBill(billId);
    }
    billIds.length = 0;
    for (const tagId of tagIds) {
      await cleanupTestTag(tagId);
    }
    tagIds.length = 0;
    for (const sessionId of dietSessionIds) {
      await cleanupTestDietSession(sessionId);
    }
    dietSessionIds.length = 0;
  });

  // ============================================================
  // findPublishedBillsWithContents
  // ============================================================

  describe("findPublishedBillsWithContents", () => {
    it("公開済み議案を難易度コンテンツ付きで取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "テストタイトル",
      });

      const result = await findPublishedBillsWithContents("normal");

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeDefined();
      expect(found?.bill_contents).toHaveLength(1);
      expect(found?.bill_contents[0].title).toBe("テストタイトル");
      expect(found?.bill_contents[0].difficulty_level).toBe("normal");
    });

    it("下書き議案は含まれない", async () => {
      const bill = await createTestBill({ publish_status: "draft" });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findPublishedBillsWithContents("normal");

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeUndefined();
    });

    it("指定した難易度のコンテンツがない議案は含まれない", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "hard" });

      const result = await findPublishedBillsWithContents("normal");

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeUndefined();
    });
  });

  // ============================================================
  // findPublishedBillById
  // ============================================================

  describe("findPublishedBillById", () => {
    it("公開済み議案を取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        name: "公開テスト議案",
      });
      billIds.push(bill.id);

      const result = await findPublishedBillById(bill.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("公開テスト議案");
    });

    it("下書き議案は取得できない", async () => {
      const bill = await createTestBill({ publish_status: "draft" });
      billIds.push(bill.id);

      const result = await findPublishedBillById(bill.id);

      expect(result).toBeNull();
    });

    it("存在しないIDではnullを返す", async () => {
      const result = await findPublishedBillById(
        "00000000-0000-0000-0000-000000000000"
      );

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findBillById
  // ============================================================

  describe("findBillById", () => {
    it("ステータス問わず議案を取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "draft",
        name: "管理者用テスト議案",
      });
      billIds.push(bill.id);

      const result = await findBillById(bill.id);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("管理者用テスト議案");
    });

    it("存在しないIDではnullを返す", async () => {
      const result = await findBillById("00000000-0000-0000-0000-000000000000");

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findMiraiStanceByBillId
  // ============================================================

  describe("findMiraiStanceByBillId", () => {
    it("議案のmirai_stanceを取得できる", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestMiraiStance(bill.id, {
        type: "for",
        comment: "賛成コメント",
      });

      const result = await findMiraiStanceByBillId(bill.id);

      expect(result).not.toBeNull();
      expect(result?.type).toBe("for");
      expect(result?.comment).toBe("賛成コメント");
    });

    it("stanceが存在しない場合はnullを返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await findMiraiStanceByBillId(bill.id);

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findTagsByBillId
  // ============================================================

  describe("findTagsByBillId", () => {
    it("議案のタグを取得できる", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      const tag = await createTestTag({ label: "テストタグ用ラベル" });
      tagIds.push(tag.id);
      await createTestBillTag(bill.id, tag.id);

      const result = await findTagsByBillId(bill.id);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(1);
      expect(result?.[0].tags).toEqual(
        expect.objectContaining({
          id: tag.id,
          label: "テストタグ用ラベル",
        })
      );
    });

    it("タグが存在しない場合は空配列を返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await findTagsByBillId(bill.id);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // findBillContentByDifficulty
  // ============================================================

  describe("findBillContentByDifficulty", () => {
    it("指定した難易度の議案コンテンツを取得できる", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "ふつうタイトル",
      });
      await createTestBillContent(bill.id, {
        difficulty_level: "hard",
        title: "むずかしいタイトル",
      });

      const result = await findBillContentByDifficulty(bill.id, "normal");

      expect(result).not.toBeNull();
      expect(result?.title).toBe("ふつうタイトル");
      expect(result?.difficulty_level).toBe("normal");
    });

    it("該当する難易度がない場合はnullを返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findBillContentByDifficulty(bill.id, "hard");

      expect(result).toBeNull();
    });
  });

  // ============================================================
  // findTagsByBillIds
  // ============================================================

  describe("findTagsByBillIds", () => {
    it("複数の議案のタグを一括取得してグループ化できる", async () => {
      const bill1 = await createTestBill();
      const bill2 = await createTestBill();
      billIds.push(bill1.id, bill2.id);

      const tag1 = await createTestTag({ label: "タグA-一括取得テスト" });
      const tag2 = await createTestTag({ label: "タグB-一括取得テスト" });
      tagIds.push(tag1.id, tag2.id);

      await createTestBillTag(bill1.id, tag1.id);
      await createTestBillTag(bill1.id, tag2.id);
      await createTestBillTag(bill2.id, tag1.id);

      const result = await findTagsByBillIds([bill1.id, bill2.id]);

      expect(result.get(bill1.id)).toHaveLength(2);
      expect(result.get(bill2.id)).toHaveLength(1);
    });

    it("空配列を渡した場合は空のMapを返す", async () => {
      const result = await findTagsByBillIds([]);

      expect(result.size).toBe(0);
    });
  });

  // ============================================================
  // findPublishedBillsByDietSession
  // ============================================================

  describe("findPublishedBillsByDietSession", () => {
    it("国会会期IDに紐づく公開済み議案を取得できる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findPublishedBillsByDietSession(
        session.id,
        "normal"
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(bill.id);
      expect(result[0].bill_contents).toHaveLength(1);
    });

    it("別の会期の議案は含まれない", async () => {
      const session1 = await createTestDietSession({
        slug: `session1-${Date.now()}`,
      });
      const session2 = await createTestDietSession({
        slug: `session2-${Date.now()}`,
      });
      dietSessionIds.push(session1.id, session2.id);

      const bill = await createTestBill({
        publish_status: "published",
        diet_session_id: session1.id,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findPublishedBillsByDietSession(
        session2.id,
        "normal"
      );

      expect(result).toHaveLength(0);
    });
  });

  // ============================================================
  // findPreviousSessionBills
  // ============================================================

  describe("findPreviousSessionBills", () => {
    it("前回の国会会期の公開済み議案を件数制限ありで取得できる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill1 = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date(Date.now() - 1000).toISOString(),
      });
      const bill2 = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill1.id, bill2.id);
      await createTestBillContent(bill1.id, { difficulty_level: "normal" });
      await createTestBillContent(bill2.id, { difficulty_level: "normal" });

      const result = await findPreviousSessionBills(session.id, "normal", 1);

      expect(result).toHaveLength(1);
    });

    it("公開済み議案がない場合は空配列を返す", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const result = await findPreviousSessionBills(session.id, "normal", 10);

      expect(result).toEqual([]);
    });
  });

  // ============================================================
  // countPublishedBillsByDietSession
  // ============================================================

  describe("countPublishedBillsByDietSession", () => {
    it("公開済み議案数を正しくカウントできる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill1 = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      const bill2 = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      const draftBill = await createTestBill({
        publish_status: "draft",
        diet_session_id: session.id,
      });
      billIds.push(bill1.id, bill2.id, draftBill.id);
      await createTestBillContent(bill1.id, { difficulty_level: "normal" });
      await createTestBillContent(bill2.id, { difficulty_level: "normal" });
      await createTestBillContent(draftBill.id, { difficulty_level: "normal" });

      const count = await countPublishedBillsByDietSession(
        session.id,
        "normal"
      );

      expect(count).toBe(2);
    });

    it("該当する議案がない場合は0を返す", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const count = await countPublishedBillsByDietSession(
        session.id,
        "normal"
      );

      expect(count).toBe(0);
    });
  });

  // ============================================================
  // findFeaturedTags
  // ============================================================

  describe("findFeaturedTags", () => {
    it("featured_priorityが設定されているタグを取得できる", async () => {
      const tag = await createTestTag({
        label: `featured-tag-${Date.now()}`,
        featured_priority: 1,
      });
      tagIds.push(tag.id);

      const result = await findFeaturedTags();

      const found = result.find((t) => t.id === tag.id);
      expect(found).toBeDefined();
      expect(found?.featured_priority).toBe(1);
    });

    it("featured_priorityがnullのタグは含まれない", async () => {
      const tag = await createTestTag({
        label: `non-featured-tag-${Date.now()}`,
      });
      tagIds.push(tag.id);

      const result = await findFeaturedTags();

      const found = result.find((t) => t.id === tag.id);
      expect(found).toBeUndefined();
    });
  });

  // ============================================================
  // findPublishedBillsByTag
  // ============================================================

  describe("findPublishedBillsByTag", () => {
    it("特定タグに紐づく公開済み議案を取得できる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill = await createTestBill({
        publish_status: "published",
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });
      const tag = await createTestTag({ label: `tag-by-tag-${Date.now()}` });
      tagIds.push(tag.id);
      await createTestBillTag(bill.id, tag.id);

      const result = await findPublishedBillsByTag(
        tag.id,
        "normal",
        session.id
      );

      expect(result).not.toBeNull();
      expect(result?.length).toBeGreaterThanOrEqual(1);
      const found = result?.find((r) => r.bill_id === bill.id);
      expect(found).toBeDefined();
    });

    it("dietSessionIdがnullの場合は全会期から取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });
      const tag = await createTestTag({
        label: `tag-no-session-${Date.now()}`,
      });
      tagIds.push(tag.id);
      await createTestBillTag(bill.id, tag.id);

      const result = await findPublishedBillsByTag(tag.id, "normal", null);

      expect(result).not.toBeNull();
      const found = result?.find((r) => r.bill_id === bill.id);
      expect(found).toBeDefined();
    });
  });

  // ============================================================
  // findFeaturedBillsWithContents
  // ============================================================

  describe("findFeaturedBillsWithContents", () => {
    it("注目の議案を取得できる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill = await createTestBill({
        publish_status: "published",
        is_featured: true,
        diet_session_id: session.id,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "注目議案タイトル",
      });

      const result = await findFeaturedBillsWithContents("normal", session.id);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeDefined();
      expect(found?.is_featured).toBe(true);
      expect(found?.bill_contents).toHaveLength(1);
      expect(found?.bill_contents[0].title).toBe("注目議案タイトル");
    });

    it("is_featured=falseの議案は含まれない", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        is_featured: false,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findFeaturedBillsWithContents("normal", null);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeUndefined();
    });

    it("dietSessionIdがnullの場合は全会期から取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        is_featured: true,
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, { difficulty_level: "normal" });

      const result = await findFeaturedBillsWithContents("normal", null);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeDefined();
    });
  });

  // ============================================================
  // findComingSoonBills
  // ============================================================

  describe("findComingSoonBills", () => {
    it("coming_soon議案を取得できる", async () => {
      const session = await createTestDietSession();
      dietSessionIds.push(session.id);

      const bill = await createTestBill({
        publish_status: "coming_soon",
        diet_session_id: session.id,
        name: "近日公開テスト議案",
      });
      billIds.push(bill.id);
      await createTestBillContent(bill.id, {
        difficulty_level: "normal",
        title: "近日公開タイトル",
      });

      const result = await findComingSoonBills(session.id);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("近日公開テスト議案");
    });

    it("dietSessionIdがnullの場合は全会期から取得できる", async () => {
      const bill = await createTestBill({
        publish_status: "coming_soon",
        name: "全会期近日公開テスト",
      });
      billIds.push(bill.id);

      const result = await findComingSoonBills(null);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeDefined();
    });

    it("publishedの議案は含まれない", async () => {
      const bill = await createTestBill({
        publish_status: "published",
        published_at: new Date().toISOString(),
      });
      billIds.push(bill.id);

      const result = await findComingSoonBills(null);

      const found = result.find((b) => b.id === bill.id);
      expect(found).toBeUndefined();
    });
  });

  // ============================================================
  // findPreviewToken
  // ============================================================

  describe("findPreviewToken", () => {
    it("有効なプレビュートークンを取得できる", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const futureDate = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();
      const previewToken = await createTestPreviewToken(bill.id, {
        token: "valid-test-token",
        expires_at: futureDate,
      });

      const result = await findPreviewToken(bill.id, "valid-test-token");

      expect(result).not.toBeNull();
      expect(result?.expires_at).toBe(previewToken.expires_at);
    });

    it("存在しないトークンではnullを返す", async () => {
      const bill = await createTestBill();
      billIds.push(bill.id);

      const result = await findPreviewToken(bill.id, "nonexistent-token");

      expect(result).toBeNull();
    });

    it("別の議案のトークンでは取得できない", async () => {
      const bill1 = await createTestBill();
      const bill2 = await createTestBill();
      billIds.push(bill1.id, bill2.id);

      await createTestPreviewToken(bill1.id, {
        token: "bill1-token",
      });

      const result = await findPreviewToken(bill2.id, "bill1-token");

      expect(result).toBeNull();
    });
  });
});
