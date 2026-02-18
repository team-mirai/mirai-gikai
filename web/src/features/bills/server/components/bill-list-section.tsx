import { BillList } from "../../client/components/bill-list/bill-list";
import type { BillWithContent } from "../../shared/types";

interface BillListSectionProps {
  bills: BillWithContent[];
}

export function BillListSection({ bills }: BillListSectionProps) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">議案一覧</h2>
        <p className="text-sm text-gray-600 mb-4">
          {bills.length}件の議案が公開されています
        </p>
      </div>
      <BillList bills={bills} />
    </section>
  );
}
