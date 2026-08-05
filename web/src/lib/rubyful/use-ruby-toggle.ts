import { useEffect, useState } from "react";
import { rubyfulClient } from "./index";

/**
 * ルビ表示の切り替えロジックを管理するカスタムフック
 *
 * このフックは PopoverContent 内の RubyToggle からのみ使われ、
 * ポップオーバーを開くまでマウントされない。ページ表示のたびに送るべき
 * GAトラッキングは、常時マウントされる RubyfulInitializer 側で行う。
 */
export function useRubyToggle() {
  const [rubyEnabled, setRubyEnabled] = useState(false);

  useEffect(() => {
    // LocalStorageから初期状態を取得
    setRubyEnabled(rubyfulClient.getIsEnabledFromStorage());
  }, []);

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
