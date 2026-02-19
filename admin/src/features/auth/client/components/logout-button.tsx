"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogout } from "../hooks/use-logout";

export function LogoutButton() {
  const { logout, isLoading } = useLogout();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={logout}
      disabled={isLoading}
      className="text-gray-600 hover:text-gray-900"
    >
      <LogOut className="h-4 w-4 mr-2" />
      {isLoading ? "ログアウト中..." : "ログアウト"}
    </Button>
  );
}
