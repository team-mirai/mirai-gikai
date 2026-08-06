import { AnalysisViewerPage } from "@/features/analysis-viewer/server/components/analysis-viewer-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    audience?: string | string[];
    view?: string | string[];
    q?: string | string[];
  }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  return <AnalysisViewerPage billId={id} searchParams={resolvedSearchParams} />;
}
