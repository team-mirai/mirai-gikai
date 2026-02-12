"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { rubyfulClient } from "./index";

interface RubyProps {
  children: ReactNode;
  ruby: string;
}

export function ManualRuby({ children, ruby }: RubyProps) {
  const [isRubyEnabled, setIsRubyEnabled] = useState(false);

  useEffect(() => {
    setIsRubyEnabled(rubyfulClient.getIsEnabledFromStorage());
  }, []);

  return (
    // biome-ignore lint/a11y/useValidAriaRole: rubyfulの仕様に乗っ取る
    <ruby aria-label={ruby} role="text">
      {children}
      {isRubyEnabled && (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: rubyfulの仕様に乗っ取る
        <rt className="rubyful-rt" aria-hidden="true">
          {ruby}
        </rt>
      )}
    </ruby>
  );
}
