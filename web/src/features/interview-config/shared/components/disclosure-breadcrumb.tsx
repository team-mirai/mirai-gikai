import { Breadcrumb } from "@/components/ui/breadcrumb";
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

  return <Breadcrumb items={items} />;
}
