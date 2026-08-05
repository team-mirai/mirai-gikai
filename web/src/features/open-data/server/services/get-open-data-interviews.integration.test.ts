import { MIN_PUBLIC_REPORTS_FOR_DISPLAY } from "@mirai-gikai/shared/report-publication/auto-publish";
import {
  adminClient,
  cleanupTestBill,
  cleanupTestUser,
  createTestBill,
  createTestUser,
  type TestUser,
} from "@test-utils/utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getOpenDataInterviews } from "./get-open-data-interviews";

/**
 * k-匿名性ゲート（議案あたり公開レポート >= MIN_PUBLIC_REPORTS_FOR_DISPLAY）を
 * 満たすデータを実DBに作り、サービス全体（RPC + メッセージ取得 + 整形）を検証する。
 * ローカルDBには他の条件合致データが存在し得るため、検証はこのテストの議案の
 * 行だけに絞って行う。
 */
describe("getOpenDataInterviews", () => {
  let testUser: TestUser;
  let billId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    const bill = await createTestBill({ publish_status: "published" });
    billId = bill.id;

    const { data: config, error: configError } = await adminClient
      .from("interview_configs")
      .insert({
        bill_id: billId,
        status: "public",
        name: `オープンデータ統合テスト ${Date.now()}`,
      })
      .select()
      .single();
    if (configError) throw new Error(configError.message);

    // ゲートを満たす数の公開レポートを作成し、うち2件だけ二次利用許諾を付ける
    for (let i = 0; i < MIN_PUBLIC_REPORTS_FOR_DISPLAY; i++) {
      const { data: session, error: sessionError } = await adminClient
        .from("interview_sessions")
        .insert({
          interview_config_id: config.id,
          user_id: testUser.id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (sessionError) throw new Error(sessionError.message);

      const consented = i < 2;
      const { error: reportError } = await adminClient
        .from("interview_report")
        .insert({
          interview_session_id: session.id,
          is_public_by_user: true,
          is_public_by_admin: true,
          is_data_reuse_consented: consented,
          summary: consented ? `許諾済み${i}` : `許諾なし${i}`,
          opinions: consented
            ? [
                {
                  title: `意見${i}`,
                  content: `本文${i}`,
                  source_message_id: "internal-meta",
                },
              ]
            : null,
          // i=1（許諾済みの新しい方）> i=0 となるよう作成時刻をずらす
          created_at: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
        });
      if (reportError) throw new Error(reportError.message);

      // 新しい方の許諾済みセッションにだけ会話ログを付ける
      if (i === 1) {
        const { error: messageError } = await adminClient
          .from("interview_messages")
          .insert([
            {
              interview_session_id: session.id,
              role: "assistant",
              content: "質問です",
            },
            {
              interview_session_id: session.id,
              role: "user",
              content: "回答です",
            },
          ]);
        if (messageError) throw new Error(messageError.message);
      }
    }
  });

  afterAll(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("許諾済みレポートのみを新しい順に返し、会話ログと意見を整形する", async () => {
    const page = await getOpenDataInterviews({ limit: 1000, cursor: null });
    const mine = page.items.filter((item) => item.billId === billId);

    // 許諾なしレポートは含まれず、新しい順
    expect(mine.map((item) => item.summary)).toEqual([
      "許諾済み1",
      "許諾済み0",
    ]);

    const [newer, older] = mine;
    // opinions は title/content のみに整形され、内部メタデータを含まない
    expect(newer?.opinions).toEqual([{ title: "意見1", content: "本文1" }]);
    // 会話ログが時系列で紐づく（メッセージなしのセッションは空配列）
    expect(newer?.messages).toEqual([
      { role: "assistant", content: "質問です" },
      { role: "user", content: "回答です" },
    ]);
    expect(older?.messages).toEqual([]);
  });

  it("cursor 以降のページには古いレポートだけが含まれる", async () => {
    const page = await getOpenDataInterviews({ limit: 1000, cursor: null });
    const newer = page.items.find((item) => item.summary === "許諾済み1");
    expect(newer).toBeTruthy();
    if (!newer) return;

    const afterCursor = await getOpenDataInterviews({
      limit: 1000,
      cursor: { createdAt: newer.createdAt, id: newer.reportId },
    });
    const mine = afterCursor.items.filter((item) => item.billId === billId);
    expect(mine.map((item) => item.summary)).toEqual(["許諾済み0"]);
  });
});
