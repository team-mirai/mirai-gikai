"use client";

import { CalendarDays, Check } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DietSession } from "@/features/diet-sessions/shared/types";
import { routes } from "@/lib/routes";

interface DietSessionMenuProps {
  sessions: DietSession[];
}

export function DietSessionMenu({ sessions }: DietSessionMenuProps) {
  const pathname = usePathname();
  const currentSession = sessions.find(
    (session) =>
      session.slug && pathname === routes.kokkaiSessionBills(session.slug)
  );

  if (sessions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[180px] gap-1.5 rounded-full bg-white px-3"
          aria-label="会期を選ぶ"
        >
          <CalendarDays className="size-4" />
          <span className="sm:hidden">会期</span>
          <span className="hidden truncate sm:inline">
            {currentSession?.name ?? "会期を選ぶ"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>定例会・臨時会を選ぶ</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sessions.map((session) => {
          const isCurrent = currentSession?.id === session.id;
          const label = `${new Date(session.start_date).getFullYear()}年 ${session.name}`;

          if (!session.slug) {
            return (
              <DropdownMenuItem key={session.id} disabled>
                <span className="truncate">{label}</span>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={session.id} asChild>
              <Link
                href={routes.kokkaiSessionBills(session.slug) as Route}
                className="flex w-full items-center justify-between"
              >
                <span className="truncate">
                  {label}
                  {session.is_active && (
                    <span className="ml-2 text-xs text-primary-accent">
                      現在
                    </span>
                  )}
                </span>
                {isCurrent && <Check className="size-4" />}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
