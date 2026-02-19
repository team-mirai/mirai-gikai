import { BillCreateForm } from "@/features/bills-edit/components/bill-create-form";
import { loadDietSessions } from "@/features/diet-sessions/server/loaders/load-diet-sessions";

export default async function BillCreatePage() {
  const dietSessions = await loadDietSessions();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">議案新規作成</h1>
      <BillCreateForm dietSessions={dietSessions} />
    </div>
  );
}
