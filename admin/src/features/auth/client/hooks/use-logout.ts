import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "@/lib/routes";
import { signOut } from "../lib/auth-client";

export function useLogout() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push(routes.login() as Route);
    } catch (err) {
      console.error("Logout failed:", err);
      // Even if logout fails on server, redirect to login
      router.push(routes.login() as Route);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    logout,
    isLoading,
  };
}
