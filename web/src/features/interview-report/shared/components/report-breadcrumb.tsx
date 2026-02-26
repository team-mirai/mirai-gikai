import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  getBillDetailLink,
  getInterviewLPLink,
} from "@/features/interview-config/shared/utils/interview-links";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ReportBreadcrumbProps {
  billId: string;
  additionalItems?: BreadcrumbItem[];
}

export function ReportBreadcrumb({
  billId,
  additionalItems = [],
}: ReportBreadcrumbProps) {
  const baseItems: BreadcrumbItem[] = [
    { label: "TOP", href: "/" },
    { label: "法案詳細", href: getBillDetailLink(billId) },
    { label: "AIインタビュー", href: getInterviewLPLink(billId) },
    { label: "レポート" },
  ];

  const allItems = [...baseItems, ...additionalItems];

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
      {allItems.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
