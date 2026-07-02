"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageSearchFormProps {
  initialQuery: string;
}

export function MessageSearchForm({ initialQuery }: MessageSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();

    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }

    // 検索条件変更時はページを1にリセット
    params.delete("page");

    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ユーザーの発言を検索"
        aria-label="発言検索キーワード"
        className="max-w-md"
      />
      <Button type="submit">
        <Search className="h-4 w-4" />
        検索
      </Button>
    </form>
  );
}
