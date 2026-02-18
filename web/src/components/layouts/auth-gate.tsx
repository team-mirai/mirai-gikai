"use client";

import type { ReactNode } from "react";
import { useAnonymousSupabaseUser } from "@/features/chat/client/hooks/use-anonymous-supabase-user";

export function AuthGate({ children }: { children?: ReactNode }) {
  useAnonymousSupabaseUser();

  return <>{children}</>;
}
