"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { previewRegistry } from "../_lib/registry";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
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
                  onClick={onNavigate}
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
    </>
  );
}

export function DevSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {/* Mobile: hamburger button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="メニューを開く"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile: overlay + drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay click-to-close */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape handled via document listener */}
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <nav className="absolute inset-y-0 left-0 w-64 bg-white p-4 overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dev" onClick={close} className="text-lg font-bold">
                Component Gallery
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                aria-label="メニューを閉じる"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={close} />
          </nav>
        </div>
      )}

      {/* Desktop: static sidebar */}
      <nav className="hidden md:block w-64 shrink-0 border-r border-mirai-border bg-white p-4 sticky top-0 h-dvh overflow-y-auto">
        <Link href="/dev" className="text-lg font-bold mb-6 block">
          Component Gallery
        </Link>
        <SidebarContent />
      </nav>
    </>
  );
}
