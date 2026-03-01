"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RunAnalysisButtonProps {
  billId: string;
}

export function RunAnalysisButton({ billId }: RunAnalysisButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/topic-analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "解析の実行に失敗しました");
        setIsRunning(false);
        return;
      }

      router.push(`/bills/${billId}/topic-analysis/${data.versionId}`);
      router.refresh();
    } catch (err) {
      console.error("Topic analysis failed:", err);
      setError("解析の実行中にエラーが発生しました");
      setIsRunning(false);
    }
  };

  return (
    <div>
      <Button onClick={handleRun} disabled={isRunning}>
        <Play className="h-4 w-4" />
        {isRunning ? "解析実行中..." : "新しい解析を実行"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
