"use client";

import Script from "next/script";
import { sendFuriganaStateEvent } from "@/lib/analytics/preference-state-events";
import { useOnPageView } from "@/lib/analytics/use-on-page-view";
import { rubyfulClient } from "./index";
import "./styles.css";

declare global {
  interface Window {
    RubyfulV2?: {
      init: (config: {
        selector: string;
        defaultDisplay: boolean;
        observeChanges?: boolean;
        styles?: object;
      }) => void;
    };
  }
}

export function RubyfulInitializer() {
  // レイアウトに常時マウントされるこのコンポーネントで、
  // 現在のふりがな表示設定をページ表示のたびにGAへ送る
  // (RubyToggleはPopoverContent内にありポップオーバーを
  //  開くまでマウントされないため、送信元には適さない)
  useOnPageView(() => {
    sendFuriganaStateEvent(rubyfulClient.getIsEnabledFromStorage());
  });

  return (
    <Script
      src="https://rubyful-v2.s3.ap-northeast-1.amazonaws.com/v2/rubyful.js?t=20250507022654"
      strategy="afterInteractive"
      onLoad={() => {
        if (typeof window !== "undefined" && window.RubyfulV2) {
          const isEnabled = rubyfulClient.getIsEnabledFromStorage();
          if (!isEnabled) return;
          // Rubyful V2を初期化
          window.RubyfulV2.init({
            selector:
              "main p, main h1, main h2, main h3, main h4, main h5, main h6, main li, main td, main th, main span, main a",
            defaultDisplay: true,
            observeChanges: true,
            styles: {
              toggleButtonClass: "ruby-button",
            },
          });
        }
      }}
    />
  );
}
