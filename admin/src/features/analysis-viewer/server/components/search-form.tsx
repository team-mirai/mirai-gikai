import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 意見検索のフォーム。
 * GET で自分自身に投げるだけなので Server Component のまま置ける。
 * audience は hidden で持ち回して、検索しても絞り込みが外れないようにする。
 */
export function SearchForm({
  action,
  audience,
  defaultValue,
}: {
  action: string;
  audience: string;
  defaultValue: string;
}) {
  return (
    <form action={action} method="get" className="mb-4 flex gap-2">
      <input type="hidden" name="view" value="search" />
      {audience !== "all" && (
        <input type="hidden" name="audience" value={audience} />
      )}
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="意見・引用・懸念・提案を検索"
        aria-label="意見を検索"
        className="max-w-md"
      />
      <Button type="submit" variant="outline">
        <Search className="h-4 w-4" />
        検索
      </Button>
    </form>
  );
}
