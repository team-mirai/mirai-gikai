"use client";

import {
  ChartNetwork,
  Edit,
  FileText,
  type LucideIcon,
  MessageCircle,
  MoreVertical,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { routes } from "@/lib/routes";
import { DeleteBillButton } from "./delete-bill-button";
import { DuplicateBillButton } from "./duplicate-bill-button";

interface BillActionsMenuProps {
  billId: string;
  billName: string;
}

function BillActionMenuLink({
  href,
  icon: Icon,
  children,
}: {
  href: Route;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Button asChild variant="ghost" size="sm" className="w-full justify-start">
      <Link href={href}>
        <Icon className="h-4 w-4 mr-2" />
        {children}
      </Link>
    </Button>
  );
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
          <BillActionMenuLink
            href={routes.billEdit(billId) as Route}
            icon={Edit}
          >
            基本情報
          </BillActionMenuLink>
          <BillActionMenuLink
            href={routes.billContentsEdit(billId) as Route}
            icon={FileText}
          >
            コンテンツ
          </BillActionMenuLink>
          <BillActionMenuLink
            href={routes.billInterview(billId) as Route}
            icon={MessageCircle}
          >
            インタビュー設定
          </BillActionMenuLink>
          <BillActionMenuLink
            href={routes.billUserTopicAnalysis(billId) as Route}
            icon={ChartNetwork}
          >
            トピック分析
          </BillActionMenuLink>
          <div className="my-1 border-t" />
          <DuplicateBillButton billId={billId} billName={billName} />
          <DeleteBillButton billId={billId} billName={billName} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
