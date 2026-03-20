"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

const navigationLinks = [
  { href: routes.bills(), label: "議案管理" },
  { href: routes.dietSessions(), label: "国会会期管理" },
  { href: routes.tags(), label: "タグ管理" },
  { href: routes.admins(), label: "管理者" },
];

export function NavigationLinks() {
  const pathname = usePathname();

  return (
    <nav>
      <div className="flex space-x-8">
        {navigationLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href as Route}
              className={cn(
                "inline-flex items-center gap-2 px-1 py-4 text-sm border-b-2 transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium"
              )}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
