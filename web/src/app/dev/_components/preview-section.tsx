import type { ReactNode } from "react";

interface PreviewSectionProps {
  label: string;
  children: ReactNode;
}

export function PreviewSection({ label, children }: PreviewSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-sm font-medium text-mirai-text-secondary mb-2">
        {label}
      </h3>
      <div className="p-4">{children}</div>
    </div>
  );
}
