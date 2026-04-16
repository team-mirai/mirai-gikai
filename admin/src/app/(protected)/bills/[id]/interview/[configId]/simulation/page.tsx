import { SimulationListPage } from "@/features/interview-simulation/server/components/simulation-list-page";

interface PageProps {
  params: Promise<{ id: string; configId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id, configId } = await params;
  return <SimulationListPage billId={id} configId={configId} />;
}
