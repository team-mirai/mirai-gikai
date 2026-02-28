import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  getBillDetailLink,
  getInterviewLPLink,
} from "../utils/interview-links";

interface DisclosureBreadcrumbProps {
  billId: string;
  previewToken?: string;
}

export function DisclosureBreadcrumb({
  billId,
  previewToken,
}: DisclosureBreadcrumbProps) {
  const items = [
    { label: "TOP", href: "/" },
    { label: "法案詳細", href: getBillDetailLink(billId, previewToken) },
    {
      label: "AIインタビュー",
      href: getInterviewLPLink(billId, previewToken),
    },
    { label: "情報開示" },
  ];

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-800">
      {items.map((item, index) => (
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
