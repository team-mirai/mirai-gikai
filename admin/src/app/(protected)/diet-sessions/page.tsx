import { DietSessionForm } from "@/features/diet-sessions/client/components/diet-session-form";
import { DietSessionList } from "@/features/diet-sessions/server/components/diet-session-list";
import { loadDietSessions } from "@/features/diet-sessions/server/loaders/load-diet-sessions";

export default async function DietSessionsPage() {
  const sessions = await loadDietSessions();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">国会会期管理</h1>

      {/* 国会会期追加セクション */}
      <section className="mb-8 rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">国会会期を追加</h2>
        <DietSessionForm />
      </section>

      {/* 国会会期一覧セクション */}
      <section className="rounded-lg border bg-white p-6">
        <DietSessionList sessions={sessions} />
      </section>
    </div>
  );
}
