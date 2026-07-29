import { useEffect, useState } from "react";
import { sendFuriganaStateEvent } from "@/lib/analytics/preference-state-events";
import { useOnPageView } from "@/lib/analytics/use-on-page-view";
import { rubyfulClient } from "./index";

/**
 * ルビ表示の切り替えロジックを管理するカスタムフック
 */
export function useRubyToggle() {
  const [rubyEnabled, setRubyEnabled] = useState(false);

  useEffect(() => {
    // LocalStorageから初期状態を取得
    setRubyEnabled(rubyfulClient.getIsEnabledFromStorage());
  }, []);

  // 現在の設定をLocalStorageから直接読み、ページ表示のたびにGAへ送る
  // (rubyEnabled stateではなくstorageを直接読むのは、マウント直後の
  //  state未反映タイミングで古い値を送ってしまうのを避けるため)
  useOnPageView(() => {
    sendFuriganaStateEvent(rubyfulClient.getIsEnabledFromStorage());
  });

  const handleRubyToggle = (checked: boolean) => {
    setRubyEnabled(checked);

    if (checked) {
      rubyfulClient.show();
    } else {
      rubyfulClient.hide();
    }
    // 画面をリロード
    window.location.reload();
  };

  return {
    rubyEnabled,
    handleRubyToggle,
  };
}
