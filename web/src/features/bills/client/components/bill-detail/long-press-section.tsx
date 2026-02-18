import { MessageCircleQuestion } from "lucide-react";
import Image from "next/image";
import { ManualRuby } from "@/lib/rubyful/manual-ruby";

export function LongPressSection() {
  return (
    <section className="relative bg-white rounded-2xl !px-3 !py-10 overflow-hidden">
      {/* コンテンツエリア */}
      <div className="relative h-full flex items-center justify-between px-3 gap-6">
        {/* 左側：テキストコンテンツ */}
        <div className="flex flex-col gap-0">
          {/* 1行目 */}
          <p className="text-[#1F2937] text-base font-medium leading-[1.2] font-noto-sans !mt-0 !mb-0">
            <span className="inline-block px-1">わからない言葉を</span>
            <br className="pc:hidden" />
            <span className="inline-block bg-[#B2D3E8] px-1">
              <span className="pc:hidden">
                <ManualRuby ruby="なが">長</ManualRuby>押しで
              </span>
              選択する
            </span>
            と
          </p>

          {/* 3行目 */}
          <div className="flex items-start gap-2 pt-2">
            <div className="inline-flex items-center gap-1 bg-white border border-[#D2D2D2] rounded-lg px-1.5 py-1 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.2)]">
              <MessageCircleQuestion className={`h-4 w-4`} />
              <span className="text-[#1F2937] text-sm font-medium leading-[1.43] font-noto-sans text-center">
                AIに質問
              </span>
            </div>
            <p className="text-[#1F2937] text-base font-medium leading-[1.2] font-noto-sans !mt-0 !mb-0">
              できます。
            </p>
          </div>
        </div>

        {/* 右側：イラスト */}
        <div className="absolute bottom-[-54px] right-3 flex-shrink-0">
          <Image
            src="/illustrations/inspiration-simple-green.svg"
            alt="電球のイラスト"
            width={122}
            height={157}
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
}
