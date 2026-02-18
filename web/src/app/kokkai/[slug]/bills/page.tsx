import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { getDietSessionBySlug } from "@/features/diet-sessions/server/loaders/get-diet-session-by-slug";
import { getBillsByDietSession } from "@/features/bills/server/loaders/get-bills-by-diet-session";
import { DietSessionBillList } from "@/features/diet-sessions/client/components/diet-session-bill-list";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const session = await getDietSessionBySlug(slug);

  if (!session) {
    return { title: "国会会期が見つかりません" };
  }

  return {
    title: `${session.name}の法案一覧 | みらい議会`,
    description: `${session.name}（${session.start_date}〜${session.end_date}）に提出された法案の一覧です。`,
  };
}

export default async function DietSessionBillsPage({ params }: Props) {
  const { slug } = await params;
  const session = await getDietSessionBySlug(slug);

  if (!session) {
    notFound();
  }

  const bills = await getBillsByDietSession(session.id);

  return (
    <Container className="py-8">
      <DietSessionBillList session={session} bills={bills} />
    </Container>
  );
}
