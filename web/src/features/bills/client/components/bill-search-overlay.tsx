"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { routes } from "@/lib/routes";
import type { BillTag } from "../../shared/types";
import {
  billsListHref,
  DEFAULT_BILLS_LIST_PARAMS,
} from "../../shared/utils/parse-bills-list-params";
import {
  type SuggestableBill,
  suggestBills,
} from "../../shared/utils/suggest-bills";

type TagWithCount = BillTag & { count: number };

/**
 * トップページの検索入口。
 *
 * 一覧ページへ直接飛ばさずにモーダルを挟む。トップを見ている人は「何を
 * 探すか」がまだ決まっていないことが多く、キーワードとテーマの両方を
 * その場に並べたいため。
 *
 * 全件の絞り込みは一覧ページが持つ。ここで絞り込みまでやると同じロジックが
 * 二重になるので、送信先は `/bills` のクエリ付きURLにする。
 *
 * 候補は手元の配列から出す。公開議案は数十件なので、打鍵ごとにサーバーへ
 * 行かなくても絞り込める。往復が無いぶん候補が即時に出るうえ、遅れて届いた
 * 古い結果が新しい入力を上書きする問題も起きない。
 */
export function BillSearchOverlay({
  tags,
  bills,
}: {
  tags: TagWithCount[];
  bills: SuggestableBill[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const matches = suggestBills(bills, query);
  const hasQuery = query.trim().length > 0;

  const submit = () => {
    const trimmed = query.trim();
    setOpen(false);
    router.push(billsListHref(DEFAULT_BILLS_LIST_PARAMS, { query: trimmed }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-bold text-mirai-brand-teal-hover hover:underline">
        <Search className="h-4 w-4" aria-hidden />
        法案を検索する
        <ChevronRight className="h-4 w-4" aria-hidden />
      </DialogTrigger>

      <DialogContent className="gap-6 sm:max-w-3xl">
        <DialogTitle className="sr-only">法案を検索</DialogTitle>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 rounded-full border border-mirai-border bg-mirai-surface px-4 py-1.5 focus-within:border-primary focus-within:bg-white"
        >
          <Search
            className="h-[18px] w-[18px] shrink-0 text-mirai-text-muted"
            aria-hidden
          />
          <input
            // モーダルは検索のために開くので、開いた時点で入力できるようにする。
            autoFocus
            type="search"
            name="q"
            aria-label="法案を検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="法案名やキーワードで探す"
            className="w-full bg-transparent text-sm outline-none"
          />
          <Button
            type="submit"
            size="sm"
            className="border-transparent bg-mirai-text px-4 text-white"
          >
            検索
          </Button>
        </form>

        {hasQuery && (
          <div className="flex flex-col">
            {matches.map((bill) => (
              <Link
                key={bill.id}
                href={routes.billDetail(bill.id)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm hover:bg-mirai-surface"
              >
                <Search
                  className="h-[15px] w-[15px] shrink-0 text-mirai-text-muted"
                  aria-hidden
                />
                <span className="min-w-0 truncate">
                  {bill.bill_content?.title || bill.name}
                </span>
              </Link>
            ))}
            {matches.length === 0 && (
              <p className="px-2 py-2.5 text-sm text-mirai-text-muted">
                「{query.trim()}」に一致する法案は見つかりませんでした
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] font-bold text-mirai-text-secondary">
            テーマから探す
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={billsListHref(DEFAULT_BILLS_LIST_PARAMS, {
                  tagId: tag.id,
                })}
                onClick={() => setOpen(false)}
                className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-mirai-border bg-white px-3.5 text-[13px] font-bold text-mirai-text hover:bg-mirai-brand-mint"
              >
                {tag.label}
                <span className="font-lexend text-xs font-bold text-mirai-text-muted">
                  {tag.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
