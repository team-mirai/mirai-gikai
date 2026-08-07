import Image from "next/image";
import { Container } from "@/components/layouts/container";

export function Hero() {
  return (
    <div className="relative w-full h-[80vh] min-h-[400px] md:h-[70vh]">
      <Image
        src="/img/hero_background.png"
        alt="国会議事堂"
        fill
        priority
        className="object-cover"
        sizes="100vw"
        quality={85}
      />
      <div className="absolute bottom-[30vh] left-0 right-0 py-4">
        <Container>
          <h1 className="font-bold text-xl leading-relaxed md:text-2xl">
            いま国会で議論されていること <br />
            やさしい言葉で説明します
          </h1>
          <p className="mt-2 font-lexend text-xs">powered by Team Mirai & AI</p>
        </Container>
      </div>

      {/* スクロールインジケーター */}
      <div
        aria-hidden="true"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center animate-bounce-gentle"
      >
        <div className="w-[1px] h-[34px] bg-black"></div>
        <p className="mt-2 font-lexend text-[10px] leading-[20px] text-black">
          Scroll
        </p>
      </div>
    </div>
  );
}
