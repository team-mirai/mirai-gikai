import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layouts/container";
import { getBillsByDietSession } from "@/features/bills/server/loaders/get-bills-by-diet-session";
import { DietSessionBillList } from "@/features/diet-sessions/client/components/diet-session-bill-list";
import { getDietSessionBySlug } from "@/features/diet-sessions/server/loaders/get-diet-session-by-slug";
import { routes } from "@/lib/routes";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const session = await getDietSessionBySlug(slug);

  if (!session) {
    return { title: "市議会の会期が見つかりません" };
  }

  return {
    title: `${session.name}の議案一覧 | みらい議会＠草津市`,
    description: `${session.name}（${session.start_date}〜${session.end_date}）に提出された議案の一覧です。`,
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
    <div className="bg-mirai-surface-muted">
      {/* ヒーロー画像 */}
      <div className="relative h-[110px] w-full overflow-hidden md:h-[130px]">
        <Image
          src="/img/kusatsu-city-hall.webp"
          alt="草津市役所"
          fill
          priority
          className="object-cover object-[center_22%]"
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-emerald-50/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/20 to-emerald-100/55" />
      </div>

      <Container className="py-8">
        <DietSessionBillList session={session} bills={bills} />
      </Container>

      {/* パンくずリスト */}
      <Container className="py-8">
        <nav className="flex items-center gap-2 text-[15px]">
          <Link href={routes.home()} className="text-black">
            TOP
          </Link>
          <ChevronRight className="h-5 w-5 text-black" />
          <span className="text-black">過去の議案</span>
        </nav>
      </Container>
    </div>
  );
}
