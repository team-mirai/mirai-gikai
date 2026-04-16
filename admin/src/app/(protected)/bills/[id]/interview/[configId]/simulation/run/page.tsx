import { SimulationRunPage } from "@/features/interview-simulation/server/components/simulation-run-page";

interface PageProps {
  params: Promise<{ id: string; configId: string }>;
  searchParams: Promise<{ reportId?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id, configId } = await params;
  const { reportId } = await searchParams;
  return (
    <SimulationRunPage
      billId={id}
      configId={configId}
      reportId={reportId ?? null}
    />
  );
}
