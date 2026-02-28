import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DevSidebar } from "./_components/dev-sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | Dev Preview",
    default: "Component Gallery | Dev Preview",
  },
  robots: { index: false, follow: false },
};

export default function DevLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh">
      <DevSidebar />
      <div className="flex-1 p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
