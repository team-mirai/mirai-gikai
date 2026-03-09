import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../packages/supabase/types/supabase.types";

// ── 環境変数（ローカルSupabaseの既定値をデフォルトに） ──
const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54421";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// ── クライアント ──
/** service_role 権限のクライアント（RLS バイパス） */
export const adminClient = createClient<Database>(
  SUPABASE_URL,
  SERVICE_ROLE_KEY
);

/** anon 権限のクライアント（RLS 適用） */
export function getAnonClient() {
  return createClient<Database>(SUPABASE_URL, ANON_KEY);
}

/** 認証済みクライアントを取得 */
export async function getAuthenticatedClient(email: string, password: string) {
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY);
  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`サインイン失敗: ${error.message}`);
  return client;
}

// ── テストユーザー管理 ──
export type TestUser = {
  id: string;
  email: string;
  password: string;
};

/** admin 権限を持つテストユーザーを作成 */
export async function createTestAdminUser(
  email = `test-admin-${Date.now()}@example.com`,
  password = "test-password-123"
): Promise<TestUser> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { roles: ["admin"] },
  });
  if (error) throw new Error(`admin ユーザー作成失敗: ${error.message}`);
  return { id: data.user.id, email, password };
}

/** 一般テストユーザーを作成 */
export async function createTestUser(
  email = `test-user-${Date.now()}@example.com`,
  password = "test-password-123"
): Promise<TestUser> {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(`ユーザー作成失敗: ${error.message}`);
  return { id: data.user.id, email, password };
}

/** テストユーザーを削除 */
export async function cleanupTestUser(userId: string): Promise<void> {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`ユーザー ${userId} の削除失敗: ${error.message}`);
  }
}

// ── テストデータ作成ヘルパー ──
/** テスト用 diet_session を作成 */
export async function createTestDietSession(
  overrides: Partial<{
    name: string;
    start_date: string;
    end_date: string;
    slug: string;
    is_active: boolean;
  }> = {}
) {
  const defaults = {
    name: `テスト会期 ${Date.now()}`,
    start_date: "2025-01-01",
    end_date: "2025-06-30",
    slug: `test-session-${Date.now()}`,
    is_active: false,
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("diet_sessions")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`diet_session 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 diet_session を削除 */
export async function cleanupTestDietSession(sessionId: string): Promise<void> {
  await adminClient.from("diet_sessions").delete().eq("id", sessionId);
}

/** テスト用 bill を作成 */
export async function createTestBill(
  overrides: Partial<{
    name: string;
    originating_house: "HR" | "HC";
    status:
      | "introduced"
      | "in_originating_house"
      | "in_receiving_house"
      | "enacted"
      | "rejected"
      | "preparing";
    publish_status: "draft" | "published" | "coming_soon";
    diet_session_id: string;
    is_featured: boolean;
    published_at: string;
    shugiin_url: string;
  }> = {}
) {
  const defaults = {
    name: `テスト議案 ${Date.now()}`,
    originating_house: "HR" as const,
    status: "introduced" as const,
    publish_status: "draft" as const,
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("bills")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`bill 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 bill を削除（CASCADE で関連データも削除） */
export async function cleanupTestBill(billId: string): Promise<void> {
  await adminClient.from("bills").delete().eq("id", billId);
}

/**
 * テスト用インタビューデータを一括作成
 * bill → interview_config → interview_session の階層
 */
export async function createTestInterviewData(userId: string) {
  const bill = await createTestBill();

  const { data: config, error: configError } = await adminClient
    .from("interview_configs")
    .insert({
      bill_id: bill.id,
      status: "public",
      name: `テスト設定 ${Date.now()}`,
    })
    .select()
    .single();
  if (configError || !config)
    throw new Error(`interview_config 作成失敗: ${configError?.message}`);

  const { data: session, error: sessionError } = await adminClient
    .from("interview_sessions")
    .insert({
      interview_config_id: config.id,
      user_id: userId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (sessionError || !session)
    throw new Error(`interview_session 作成失敗: ${sessionError?.message}`);

  return { bill, config, session };
}

/** テスト用 bill_contents を作成 */
export async function createTestBillContent(
  billId: string,
  overrides: Partial<{
    difficulty_level: "normal" | "hard";
    title: string;
    summary: string;
    content: string;
  }> = {}
) {
  const defaults = {
    bill_id: billId,
    difficulty_level: "normal" as const,
    title: `テスト議案タイトル ${Date.now()}`,
    summary: `テスト議案サマリー ${Date.now()}`,
    content: `# テスト議案コンテンツ ${Date.now()}`,
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("bill_contents")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`bill_contents 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 tag を作成 */
export async function createTestTag(
  overrides: Partial<{
    label: string;
    description: string;
    featured_priority: number;
  }> = {}
) {
  const defaults = {
    label: `テストタグ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("tags")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`tag 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 tag を削除 */
export async function cleanupTestTag(tagId: string): Promise<void> {
  await adminClient.from("tags").delete().eq("id", tagId);
}

/** テスト用 bills_tags を作成 */
export async function createTestBillTag(billId: string, tagId: string) {
  const { data, error } = await adminClient
    .from("bills_tags")
    .insert({ bill_id: billId, tag_id: tagId })
    .select()
    .single();
  if (error) throw new Error(`bills_tags 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 mirai_stances を作成 */
export async function createTestMiraiStance(
  billId: string,
  overrides: Partial<{
    type: "for" | "against" | "neutral";
    comment: string;
  }> = {}
) {
  const defaults = {
    bill_id: billId,
    type: "for" as const,
    comment: "テストコメント",
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("mirai_stances")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`mirai_stances 作成失敗: ${error.message}`);
  return data;
}

/** テスト用 preview_tokens を作成 */
export async function createTestPreviewToken(
  billId: string,
  overrides: Partial<{
    token: string;
    expires_at: string;
  }> = {}
) {
  const defaults = {
    bill_id: billId,
    token: `test-token-${Date.now()}`,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };
  const { data, error } = await adminClient
    .from("preview_tokens")
    .insert(defaults)
    .select()
    .single();
  if (error) throw new Error(`preview_tokens 作成失敗: ${error.message}`);
  return data;
}

/** テスト用インタビューメッセージを作成 */
export async function createTestInterviewMessages(
  sessionId: string,
  count: number
) {
  const messages = Array.from({ length: count }, (_, i) => ({
    interview_session_id: sessionId,
    role: (i % 2 === 0 ? "assistant" : "user") as "assistant" | "user",
    content: `テストメッセージ ${i + 1}`,
  }));

  const { data, error } = await adminClient
    .from("interview_messages")
    .insert(messages)
    .select();
  if (error) throw new Error(`interview_messages 作成失敗: ${error.message}`);
  return data;
}
