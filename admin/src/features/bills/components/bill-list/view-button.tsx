"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

interface ViewButtonProps {
  billId: string;
}

export function ViewButton({ billId }: ViewButtonProps) {
  const billUrl = `${env.webUrl}/bills/${billId}`;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.open(billUrl, "_blank")}
    >
      <ExternalLink className="h-4 w-4" />
      公開ページ
    </Button>
  );
}
