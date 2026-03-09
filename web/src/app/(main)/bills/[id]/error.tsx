"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function BillDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bill detail error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <Button onClick={reset}>ページ再読み込み</Button>
      </div>
    </div>
  );
}
