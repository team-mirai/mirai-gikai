import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/features/auth/server/lib/auth-server";
import { getBills } from "@/features/bills/server/loaders/get-bills";
import { OpinionBackfillRunner } from "@/features/interview-opinion-backfill/client/components/opinion-backfill-runner";
import { routes } from "@/lib/routes";

export default async function InterviewOpinionBackfillPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect(routes.login());
  }

  const bills = await getBills();
  const billOptions = bills.map((bill) => ({ id: bill.id, name: bill.name }));

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">意見再抽出バックフィル</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        既存インタビューのレポートを新プロンプトで再抽出し、意見を更新します。summary
        や stance
        など他のフィールドは変更しません。公開同意済みのレポートを優先して処理します。
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        ※
        同じレポートの二重処理を避けるため、実行中（処理が完了するまで）は再実行しないでください。
      </p>

      <section className="rounded-lg border bg-card p-6">
        <OpinionBackfillRunner bills={billOptions} />
      </section>
    </div>
  );
}
