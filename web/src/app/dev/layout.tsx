import type { ReactNode } from "react";
import { DevSidebar } from "./_components/dev-sidebar";

export default function DevLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh">
      <DevSidebar />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
