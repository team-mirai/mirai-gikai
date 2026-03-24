import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  getBillDetailLink,
  getInterviewLPLink,
} from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";

interface ReportBreadcrumbProps {
  billId: string;
  reportHref?: string;
  additionalItems?: BreadcrumbItem[];
}

export function ReportBreadcrumb({
  billId,
  reportHref,
  additionalItems = [],
}: ReportBreadcrumbProps) {
  const baseItems: BreadcrumbItem[] = [
    { label: "TOP", href: routes.home() },
    { label: "法案詳細", href: getBillDetailLink(billId) },
    { label: "AIインタビュー", href: getInterviewLPLink(billId) },
    {
      label: "レポート",
      href: reportHref,
    },
  ];

  return <Breadcrumb items={[...baseItems, ...additionalItems]} />;
}
