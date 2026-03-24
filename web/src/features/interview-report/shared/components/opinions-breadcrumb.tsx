import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { getBillDetailLink } from "@/features/interview-config/shared/utils/interview-links";
import { routes } from "@/lib/routes";

interface OpinionsBreadcrumbProps {
  billId: string;
}

export function OpinionsBreadcrumb({ billId }: OpinionsBreadcrumbProps) {
  const items: BreadcrumbItem[] = [
    { label: "TOP", href: routes.home() },
    { label: "法案詳細", href: getBillDetailLink(billId) },
    { label: "当事者の意見" },
  ];

  return <Breadcrumb items={items} />;
}
