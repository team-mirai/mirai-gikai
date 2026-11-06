import type { Metadata } from "next";
import { BillsListPage } from "@/features/bills/server/components/bills-list-page";
import type { BillsListSearchParams } from "@/features/bills/shared/utils/parse-bills-list-params";

export const metadata: Metadata = {
  title: "法案を検索する | みらい議会",
  description:
    "国会に提出された法案を、審議状況やカテゴリから探せます。気になる法案にはAIインタビューで意見を届けられます。",
};

type Props = {
  searchParams: Promise<BillsListSearchParams>;
};

export default async function BillsPage({ searchParams }: Props) {
  return <BillsListPage searchParams={await searchParams} />;
}
