"use client";

import {
  BarChart3,
  Edit,
  FileText,
  MessageCircle,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
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
          <Link href={routes.billEdit(billId) as Route}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Edit className="h-4 w-4 mr-2" />
              基本情報
            </Button>
          </Link>
          <Link href={routes.billContentsEdit(billId) as Route}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              コンテンツ
            </Button>
          </Link>
          <Link href={routes.billInterview(billId) as Route}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <MessageCircle className="h-4 w-4 mr-2" />
              インタビュー設定
            </Button>
          </Link>
          <Link href={routes.billReports(billId) as Route}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              レポート一覧
            </Button>
          </Link>
          <Link href={routes.billTopicAnalysis(billId) as Route}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Sparkles className="h-4 w-4 mr-2" />
              トピック解析
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
