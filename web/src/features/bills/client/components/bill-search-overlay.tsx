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
import {
  billsListHref,
  DEFAULT_BILLS_LIST_PARAMS,
} from "../../shared/utils/parse-bills-list-params";
import {
  type SuggestableBill,
  suggestBills,
} from "../../shared/utils/suggest-bills";
import type { TagChipItem } from "../../shared/utils/tag-chip-items";
import { TagChipLink } from "./bill-list/tag-chip-link";

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
 *
 * 候補が当てるのは名称・タイトル・タグ名だけで、要約は対象外。一覧ページの
 * 検索は要約も見るので、候補が空でも検索結果は出ることがある。空のときの
 * 文言はそれを踏まえて「候補が無い」と言うに留める。
 */
export function BillSearchOverlay({
  tags,
  bills,
}: {
  tags: TagChipItem[];
  bills: SuggestableBill[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const matches = suggestBills(bills, trimmed);

  const submit = () => {
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

      <DialogContent className="gap-6 sm:max-w-3xl" showCloseButton>
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

        {/*
          読み上げ用の領域は入力前から置いておく。挿入と同時に中身が入ると
          変化として扱われず、最初の候補が読み上げられないことがある。
        */}
        <div className="flex flex-col" aria-live="polite">
          {trimmed && (
            <>
              {matches.map((bill) => (
                <Link
                  key={bill.id}
                  href={routes.billDetail(bill.id)}
                  onClick={() => setOpen(false)}
                  // 候補は「まだ選んでいない行」なので先読みしない。打鍵ごとに
                  // 入れ替わるため、押されない遷移先を大量に取りに行ってしまう。
                  prefetch={false}
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
              {matches.length === 0 ? (
                <p className="px-2 py-2.5 text-sm text-mirai-text-muted">
                  「{trimmed}」に一致する候補はありません。検索すると要約も
                  対象になります
                </p>
              ) : (
                <p className="sr-only">{matches.length}件の候補</p>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[13px] font-bold text-mirai-text-secondary">
            テーマから探す
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <TagChipLink
                key={tag.id}
                href={billsListHref(DEFAULT_BILLS_LIST_PARAMS, {
                  tagId: tag.id,
                })}
                label={tag.label}
                count={tag.count}
                onNavigate={() => setOpen(false)}
                className="hover:bg-mirai-brand-mint"
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
