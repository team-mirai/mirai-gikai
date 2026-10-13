import { ArticleReportsPage } from "@/features/article-reports/server/components/article-reports-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArticleReportsPage billId={id} />;
}
