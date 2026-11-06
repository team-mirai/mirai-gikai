"use client";

import { ChevronRight, FileText, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { routes } from "@/lib/routes";
import { highlightMatch } from "../../shared/utils/highlight-match";
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

      {/*
        `min-w-0` を各段に通す。テーマのチップは `whitespace-nowrap` を持つため、
        途中の要素で縮めておかないと祖先の min-content が押し広げられ、狭い
        画面で中身が右にはみ出す。

        閉じるボタンはスクロールする領域の外に置く。中に入れると絶対配置の
        基準がスクロールコンテナになり、下まで送ったときに一緒に流れて画面外へ
        出てしまう。フォームと重ならないよう、独立した行にしている。
      */}
      <DialogContent
        className="grid-cols-[minmax(0,1fr)] gap-0 p-0 sm:max-w-3xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">法案を検索</DialogTitle>
        <DialogDescription className="sr-only">
          キーワードやテーマから法案を探せます。
        </DialogDescription>

        <div className="flex justify-end px-2 pt-2">
          <DialogClose
            aria-label="閉じる"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full text-mirai-text-muted transition-colors hover:bg-mirai-surface"
          >
            <X className="h-5 w-5" aria-hidden />
          </DialogClose>
        </div>

        <div className="flex max-h-[calc(100dvh-8rem)] min-w-0 flex-col gap-6 overflow-y-auto px-6 pb-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex min-w-0 items-center gap-2 rounded-full border border-mirai-border bg-mirai-surface px-4 py-1.5 focus-within:border-primary focus-within:bg-white"
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
              className="w-full min-w-0 bg-transparent text-sm outline-none"
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
          <div className="flex min-w-0 flex-col gap-1.5">
            {trimmed && matches.length > 0 && (
              <>
                <p className="text-xs font-bold text-mirai-text-secondary">
                  法案 {matches.length}件
                </p>
                <ul className="flex min-w-0 flex-col">
                  {matches.map((bill) => (
                    <li
                      key={bill.id}
                      className="min-w-0 border-mirai-border border-t first:border-t-0"
                    >
                      <SuggestRow
                        bill={bill}
                        query={trimmed}
                        onNavigate={() => setOpen(false)}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {trimmed && matches.length === 0 && (
              // JSX は行をまたぐテキストを半角スペースで繋ぐので、日本語の
              // 途中で改行すると空白が混ざる。テンプレート文字列で渡す。
              <p
                className="py-2 text-sm text-mirai-text-muted"
                aria-live="polite"
              >
                {`「${trimmed}」に一致する候補はありません。検索すると要約も対象になります`}
              </p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** 候補1行。押せることが分かるように、右端に矢印を置いて行を区切る。 */
function SuggestRow({
  bill,
  query,
  onNavigate,
}: {
  bill: SuggestableBill;
  query: string;
  onNavigate: () => void;
}) {
  const title = bill.bill_content?.title || bill.name;

  return (
    <Link
      href={routes.billDetail(bill.id)}
      onClick={onNavigate}
      // 候補は「まだ選んでいない行」なので先読みしない。打鍵ごとに入れ替わる
      // ため、押されない遷移先を大量に取りに行ってしまう。
      prefetch={false}
      className="flex min-w-0 items-center gap-2.5 py-3 text-sm hover:bg-mirai-surface"
    >
      <FileText
        className="h-4 w-4 shrink-0 text-mirai-text-muted"
        aria-hidden
      />
      {/* 候補は見比べるものなので2行で止める。全文は遷移先で読める。 */}
      <span className="line-clamp-2 min-w-0 flex-1">
        {highlightMatch(title, query).map((segment, index) =>
          segment.matched ? (
            <mark
              // 同じ語が複数回出ることがあるので、位置で区別する。
              // biome-ignore lint/suspicious/noArrayIndexKey: 断片は順番でしか識別できない
              key={index}
              className="bg-mirai-highlight text-mirai-text"
            >
              {segment.text}
            </mark>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: 断片は順番でしか識別できない
            <span key={index}>{segment.text}</span>
          )
        )}
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-mirai-text-muted"
        aria-hidden
      />
    </Link>
  );
}
