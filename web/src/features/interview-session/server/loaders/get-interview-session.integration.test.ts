import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createTestUser,
  cleanupTestUser,
  createTestInterviewData,
  cleanupTestBill,
  type TestUser,
} from "@test-utils/utils";
import type { GetUserFn } from "../utils/verify-session-ownership";
import { getInterviewSession } from "./get-interview-session";

function createGetUser(userId: string): GetUserFn {
  return async () => ({
    data: { user: { id: userId } },
    error: null,
  });
}

const getUnauthenticatedUser: GetUserFn = async () => ({
  data: { user: null },
  error: new Error("Not authenticated"),
});

describe("getInterviewSession 統合テスト", () => {
  let testUser: TestUser;
  let sessionId: string;
  let billId: string;
  let interviewConfigId: string;

  beforeEach(async () => {
    testUser = await createTestUser();
    const data = await createTestInterviewData(testUser.id);
    sessionId = data.session.id;
    billId = data.bill.id;
    interviewConfigId = data.config.id;
  });

  afterEach(async () => {
    await cleanupTestBill(billId);
    await cleanupTestUser(testUser.id);
  });

  it("アクティブなセッションを取得できる", async () => {
    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session).not.toBeNull();
    expect(session?.id).toBe(sessionId);
    expect(session?.interview_config_id).toBe(interviewConfigId);
    expect(session?.user_id).toBe(testUser.id);
    expect(session?.completed_at).toBeNull();
    expect(session?.archived_at).toBeNull();
  });

  it("未認証の場合はnullを返す", async () => {
    const session = await getInterviewSession(interviewConfigId, {
      getUser: getUnauthenticatedUser,
    });

    expect(session).toBeNull();
  });

  it("セッションが存在しない場合はnullを返す", async () => {
    const session = await getInterviewSession(
      "00000000-0000-0000-0000-000000000000",
      { getUser: createGetUser(testUser.id) }
    );

    expect(session).toBeNull();
  });

  it("完了済みセッションはnullを返す（アクティブのみ取得）", async () => {
    await adminClient
      .from("interview_sessions")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session).toBeNull();
  });

  it("完了済みセッションより古い未完了セッションが残っていてもnullを返す", async () => {
    // 途中で離脱した古いセッションをアーカイブせずに残したまま、
    // それより新しいセッションを完了済みにする。
    // LP は最新の未アーカイブセッション（完了済み）を見て
    // 「もう一度新たに回答する」を表示するため、ここで古い未完了セッションを
    // 拾ってしまうと過去の途中経過から再開されてしまう。
    await adminClient
      .from("interview_sessions")
      .update({ created_at: new Date(Date.now() - 60_000).toISOString() })
      .eq("id", sessionId);

    const { data: completedSession } = await adminClient
      .from("interview_sessions")
      .insert({
        interview_config_id: interviewConfigId,
        user_id: testUser.id,
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session).toBeNull();
    expect(completedSession?.id).not.toBe(sessionId);
  });

  it("最新の未アーカイブセッションが未完了なら再開対象として返す", async () => {
    // 完了済みセッションが過去に存在しても、その後に開始された
    // 未完了セッションは再開できる必要がある。
    await adminClient
      .from("interview_sessions")
      .update({
        completed_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 60_000).toISOString(),
      })
      .eq("id", sessionId);

    const { data: activeSession } = await adminClient
      .from("interview_sessions")
      .insert({
        interview_config_id: interviewConfigId,
        user_id: testUser.id,
      })
      .select("id")
      .single();

    const session = await getInterviewSession(interviewConfigId, {
      getUser: createGetUser(testUser.id),
    });

    expect(session?.id).toBe(activeSession?.id);
    expect(session?.completed_at).toBeNull();
  });

  it("別ユーザーのセッションはnullを返す", async () => {
    const otherUser = await createTestUser();
    try {
      const session = await getInterviewSession(interviewConfigId, {
        getUser: createGetUser(otherUser.id),
      });

      expect(session).toBeNull();
    } finally {
      await cleanupTestUser(otherUser.id);
    }
  });
});
