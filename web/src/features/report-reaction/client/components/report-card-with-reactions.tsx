"use client";

import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";
import type { ReactNode } from "react";

interface AnonymousAuthProviderProps {
  children: ReactNode;
}

/**
 * 匿名認証を1回だけ初期化するクライアントラッパー
 * リアクションボタンを含むセクションで使用し、子コンポーネント全体で認証セッションを共有する
 */
export function AnonymousAuthProvider({
  children,
}: AnonymousAuthProviderProps) {
  useAnonymousSupabaseUser();

  return <>{children}</>;
}
