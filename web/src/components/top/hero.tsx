import Image from "next/image";
import { Container } from "@/components/layouts/container";

export function Hero() {
  return (
    <div className="relative h-[52vh] min-h-[360px] w-full md:h-[500px]">
      <Image
        src="/img/kusatsu-city-hall.webp"
        alt="草津市役所"
        fill
        priority
        className="object-cover object-top"
        sizes="100vw"
        quality={85}
      />
      <div className="absolute inset-0 bg-emerald-50/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 via-emerald-100/45 to-emerald-100/85" />
      <div className="absolute inset-x-0 bottom-20 py-4">
        <Container>
          <div className="w-fit max-w-full rounded-2xl border border-emerald-900/10 bg-emerald-50/90 px-5 py-4 shadow-sm backdrop-blur-[2px] md:px-7 md:py-5">
            <p className="font-bold text-xl leading-relaxed text-slate-950 drop-shadow-sm md:text-2xl">
              いま草津市議会で議論されていること <br />
              やさしい言葉で説明します
            </p>
            <p className="mt-2 font-lexend text-xs font-medium text-slate-800">
              みらい議会＠草津市
            </p>
          </div>
        </Container>
      </div>
    </div>
  );
}
