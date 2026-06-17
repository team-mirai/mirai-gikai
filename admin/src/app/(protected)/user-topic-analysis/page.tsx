import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { AllBillsAnalysisRunner } from "@/features/user-topic-analysis/client/components/all-bills-analysis-runner";
import { routes } from "@/lib/routes";

export default async function AllBillsUserTopicAnalysisPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect(routes.login());
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">全議案トピック分析</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        すべての議案を対象にユーザー向けトピック分析を実行します。差分追加（増分）では、各議案で新しく増えた意見だけを抽出して既存トピックへ追加するため低コストです。
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        ※
        全議案を順次処理するため完了まで時間がかかります。実行中（処理が完了するまで）は再実行しないでください。個別議案の結果は各議案のトピック分析ページで確認できます。
      </p>

      <section className="rounded-lg border bg-card p-6">
        <AllBillsAnalysisRunner />
      </section>
    </div>
  );
}
