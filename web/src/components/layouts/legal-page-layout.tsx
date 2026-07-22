import type { ReactNode } from "react";
import { Container } from "@/components/layouts/container";
import { cn } from "@/lib/utils";

interface LegalPageLayoutProps {
  title: string;
  /** Team Mirai デザインシステムの節見出しに使う英字ラベル（例: "Terms of Service"） */
  enLabel?: string;
  description?: string;
  className?: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  enLabel,
  description,
  className,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-dvh bg-white">
      <section className={cn("py-12", className)}>
        <Container className="space-y-10">
          <header className="space-y-2 border-b border-neutral-200 pb-6">
            {enLabel ? (
              <p className="font-lexend text-sm font-semibold tracking-[0.14em] text-mirai-brand-teal-hover">
                {enLabel}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold tracking-wider text-black sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="pt-1 text-[15px] leading-loose tracking-wide text-mirai-text-subtle">
                {description}
              </p>
            ) : null}
          </header>

          <div className="space-y-8 text-mirai-text">{children}</div>
        </Container>
      </section>
    </div>
  );
}

interface LegalSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function LegalSectionTitle({
  children,
  className,
}: LegalSectionTitleProps) {
  return (
    <h2
      className={cn(
        "text-lg font-bold tracking-[0.04em] text-black sm:text-xl",
        className
      )}
    >
      {children}
    </h2>
  );
}

interface LegalSubSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function LegalSubSectionTitle({
  children,
  className,
}: LegalSubSectionTitleProps) {
  return (
    <h3
      className={cn(
        "text-base font-bold tracking-[0.04em] text-mirai-text",
        className
      )}
    >
      {children}
    </h3>
  );
}

interface LegalParagraphProps {
  children: ReactNode;
  className?: string;
}

export function LegalParagraph({ children, className }: LegalParagraphProps) {
  return (
    <p
      className={cn(
        "text-sm leading-[1.8] tracking-[0.04em] text-mirai-text sm:text-[15px]",
        className
      )}
    >
      {children}
    </p>
  );
}

type LegalListItem = string | { id: string; content: ReactNode };

interface LegalListProps {
  items: LegalListItem[];
  ordered?: boolean;
  className?: string;
}

export function LegalList({ items, ordered, className }: LegalListProps) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <ListTag
      className={cn(
        "space-y-1 text-sm leading-[1.8] tracking-[0.04em] text-mirai-text sm:text-[15px]",
        ordered ? "list-decimal pl-5" : "list-disc pl-5",
        className
      )}
    >
      {items.map((item) => {
        const key = typeof item === "string" ? item : item.id;
        const content = typeof item === "string" ? item : item.content;

        return <li key={key}>{content}</li>;
      })}
    </ListTag>
  );
}
