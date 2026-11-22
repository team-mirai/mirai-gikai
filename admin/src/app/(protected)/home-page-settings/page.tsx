import Link from "next/link";
import { ActiveSessionOverviewForm } from "@/features/diet-sessions/client/components/active-session-overview-form";
import { loadDietSessions } from "@/features/diet-sessions/server/loaders/load-diet-sessions";
import { routes } from "@/lib/routes";

export default async function HomePageSettingsPage() {
  const sessions = await loadDietSessions();
  const activeSession = sessions.find((session) => session.is_active);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-2 text-2xl font-bold">トップページ設定</h1>
      <p className="mb-8 text-sm text-gray-600">
        トップページの「今回の議会について」に表示する内容を編集します。
      </p>

      {activeSession ? (
        <section className="rounded-lg border bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold">今回の議会について</h2>
          <p className="mb-6 text-sm text-gray-600">
            対象会期：{activeSession.name}
          </p>
          <ActiveSessionOverviewForm session={activeSession} />
        </section>
      ) : (
        <section className="rounded-lg border bg-white p-6">
          <p className="mb-4 text-gray-700">
            アクティブな会期がありません。先に会期を設定してください。
          </p>
          <Link
            href={routes.dietSessions()}
            className="font-medium text-blue-600 hover:underline"
          >
            市議会会期管理へ
          </Link>
        </section>
      )}
    </div>
  );
}
