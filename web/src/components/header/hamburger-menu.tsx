"use client";

import { Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BillSearchDialog } from "@/features/bills/client/components/bill-search-overlay";
import { loadBillSearchData } from "@/features/bills/server/actions/load-bill-search-data";
import type { BillSearchData } from "@/features/bills/shared/types/bill-search-data";
import {
  billsListHref,
  DEFAULT_BILLS_LIST_PARAMS,
} from "@/features/bills/shared/utils/parse-bills-list-params";
import { RubyToggle } from "@/lib/rubyful";

export function HamburgerMenu() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchData, setSearchData] = useState<BillSearchData | null>(null);
  const requestIdRef = useRef(0);
  // 応答が届いた時点で検索を待っているかを知るため。state は非同期の
  // コールバックからは押した時点の値しか見えない。
  const searchRequestedRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // 検索の中身はメニューを開いた時点で取りに行く。ヘッダーは全ページに
  // 載るので先に読み込むと開かれないモーダルのために全ページが重くなる。
  // 一方で「検索」を押してから取りに行くと、そのぶん開くのが遅れる。
  //
  // 開くたびに取り直す。候補のタイトルは難易度で変わり、ヘッダーは難易度を
  // 切り替えてもマウントされたままなので、一度きりだと古い難易度が残る。
  // サーバー側はキャッシュ済みなので、取り直してもクエリは増えない。
  const fetchSearchData = () => {
    const requestId = ++requestIdRef.current;
    loadBillSearchData()
      .then((data) => {
        // 遅れて届いた古い応答で新しい中身を上書きしない。
        if (requestId === requestIdRef.current) setSearchData(data);
      })
      .catch((error) => {
        console.error("Failed to load bill search data:", error);
        // 前の中身があれば、それを使い続ければよい。困るのは検索を押して
        // 中身を待っている人だけ。
        if (requestId !== requestIdRef.current || !searchRequestedRef.current)
          return;
        searchRequestedRef.current = false;
        // 「開く」状態を残すと、次に取得できた瞬間に操作していないのに
        // モーダルが開いてしまう。検索欄のある一覧ページで応える。
        setSearchOpen(false);
        router.push(billsListHref(DEFAULT_BILLS_LIST_PARAMS));
      });
  };

  const handleMenuOpenChange = (open: boolean) => {
    setMenuOpen(open);
    if (open) fetchSearchData();
  };

  const openSearch = () => {
    // メニューを閉じてからモーダルを開く。Popover の中に Dialog を重ねると、
    // 外側クリックやフォーカスの扱いが両者でぶつかる。
    setMenuOpen(false);
    setSearchOpen(true);
    // 先読みに失敗していた場合に備えて、中身が無ければ取り直す。
    if (!searchData) {
      searchRequestedRef.current = true;
      fetchSearchData();
    }
  };

  const handleSearchOpenChange = (open: boolean) => {
    setSearchOpen(open);
    if (!open) searchRequestedRef.current = false;
  };

  return (
    <>
      <Popover open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            aria-label="メニューを開く"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-50"
          align="end"
          // 検索をすぐ開くときは、閉じたメニューのトリガーへフォーカスを
          // 戻さない。戻すと開いたばかりの検索欄からフォーカスを奪う。
          // 中身がまだ届いていなければトリガーへ戻し、届いて開いた時点で
          // 検索欄へ移す。
          onCloseAutoFocus={(event) => {
            if (searchOpen && searchData) event.preventDefault();
          }}
        >
          <div className="flex flex-col gap-3">
            {/* 文字の位置をふりがなの行と揃えるため、余白を内側に取り直す */}
            <Button
              variant="ghost"
              onClick={openSearch}
              className="-mx-2 h-auto justify-start gap-2 px-2 py-1.5 text-sm font-medium"
            >
              <Search className="h-4 w-4" aria-hidden />
              法案を検索
            </Button>
            <RubyToggle />
          </div>
        </PopoverContent>
      </Popover>

      {/*
        中身が届くまではモーダルを出さない。空のまま開くと、入力しても
        「候補はありません」と誤って伝えてしまう。届いた時点で開いている
        状態なら、そのまま表示される。
      */}
      {searchData && (
        <BillSearchDialog
          {...searchData}
          open={searchOpen}
          onOpenChange={handleSearchOpenChange}
          // モーダルを開いた要素はメニューごと消えているので、閉じたら
          // メニューのトリガーへ戻す。
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        />
      )}
    </>
  );
}
