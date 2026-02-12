"use client";

import {
  BarChart3,
  Edit,
  FileText,
  MessageCircle,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteBillButton } from "./delete-bill-button";
import { DuplicateBillButton } from "./duplicate-bill-button";

interface BillActionsMenuProps {
  billId: string;
  billName: string;
}

export function BillActionsMenu({ billId, billName }: BillActionsMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="flex flex-col">
          <Link href={`/bills/${billId}/edit`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Edit className="h-4 w-4 mr-2" />
              基本情報
            </Button>
          </Link>
          <Link href={`/bills/${billId}/contents/edit`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              コンテンツ
            </Button>
          </Link>
          <Link href={`/bills/${billId}/interview/edit`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <MessageCircle className="h-4 w-4 mr-2" />
              インタビュー設定
            </Button>
          </Link>
          <Link href={`/bills/${billId}/reports`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              レポート一覧
            </Button>
          </Link>
          <div className="my-1 border-t" />
          <DuplicateBillButton billId={billId} billName={billName} />
          <DeleteBillButton billId={billId} billName={billName} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
