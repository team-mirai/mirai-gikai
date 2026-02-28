import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import {
  getBillDetailLink,
  getInterviewLPLink,
  getInterviewReportCompleteLink,
} from "@/features/interview-config/shared/utils/interview-links";

interface ReportBreadcrumbProps {
  billId: string;
  reportId?: string;
  additionalItems?: BreadcrumbItem[];
}

export function ReportBreadcrumb({
  billId,
  reportId,
  additionalItems = [],
}: ReportBreadcrumbProps) {
  const baseItems: BreadcrumbItem[] = [
    { label: "TOP", href: "/" },
    { label: "法案詳細", href: getBillDetailLink(billId) },
    { label: "AIインタビュー", href: getInterviewLPLink(billId) },
    {
      label: "レポート",
      href: reportId ? getInterviewReportCompleteLink(reportId) : undefined,
    },
  ];

  return <Breadcrumb items={[...baseItems, ...additionalItems]} />;
}
