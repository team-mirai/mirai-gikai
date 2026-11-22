import "server-only";

import Link from "next/link";
import { routes } from "@/lib/routes";
import { ActiveSessionOverviewForm } from "../../client/components/active-session-overview-form";
import type { DietSession } from "../../shared/types";
import { loadDietSessions } from "../loaders/load-diet-sessions";

export async function ActiveSessionOverviewSettings() {
  const sessions = await loadDietSessions();
  const activeSession = sessions.find((session) => session.is_active);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-2 text-2xl font-bold">トップページ設定</h1>
      <p className="mb-8 text-sm text-gray-600">
        トップページの「今回の議会について」に表示する内容を編集します。
      </p>

      {activeSession ? (
        <ActiveSessionOverviewEditor session={activeSession} />
      ) : (
        <section className="rounded-lg border bg-white p-6">
          <p className="mb-4 text-gray-700">
            アクティブな会期がありません。先に会期を設定してください。
          </p>
          <Link
            href={routes.dietSessions()}
            className="font-medium text-blue-600 hover:underline"
          >
            会期管理へ
          </Link>
        </section>
      )}
    </div>
  );
}

function ActiveSessionOverviewEditor({ session }: { session: DietSession }) {
  return (
    <section className="rounded-lg border bg-white p-6">
      <h2 className="mb-1 text-lg font-semibold">今回の議会について</h2>
      <p className="mb-6 text-sm text-gray-600">対象会期：{session.name}</p>
      <ActiveSessionOverviewForm key={session.id} session={session} />
    </section>
  );
}
