import type { ReactNode } from "react";

interface ComponentShowcaseProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ComponentShowcase({
  title,
  description,
  children,
}: ComponentShowcaseProps) {
  return (
    <div className="mb-12">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-mirai-text">{title}</h2>
        {description && (
          <p className="text-sm text-mirai-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="border border-mirai-border rounded-lg p-6 bg-white">
        {children}
      </div>
    </div>
  );
}
