"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { previewRegistry } from "../_lib/registry";

export function DevSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 border-r border-mirai-border bg-white p-4 sticky top-0 h-dvh overflow-y-auto">
      <Link href="/dev" className="text-lg font-bold mb-6 block">
        Component Gallery
      </Link>
      {previewRegistry.map((group) => (
        <div key={group.name} className="mb-4">
          <h3 className="text-xs font-semibold text-mirai-text-secondary uppercase tracking-wider mb-2">
            {group.name}
          </h3>
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={cn(
                    "block px-3 py-1.5 rounded text-sm transition-colors",
                    pathname === item.path
                      ? "bg-primary text-white"
                      : "text-mirai-text hover:bg-mirai-surface"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
