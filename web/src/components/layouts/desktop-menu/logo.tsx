import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/routes";

/**
 * デスクトップメニュー: ロゴ (画面左上)
 */
export function DesktopMenuLogo() {
  return (
    <Link
      href={routes.home()}
      className="fixed top-6 left-6 z-50 flex items-center gap-6 hover:opacity-90 transition-opacity"
    >
      {/* ロゴ */}
      <div className="relative w-[116px] h-[98.38px]">
        <Image
          src="/img/logo.svg"
          alt="みらい議会ロゴ"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* テキスト */}
      <div className="flex flex-col gap-1.5">
        <h1
          className="font-extrabold text-black"
          style={{
            fontSize: "36px",
            lineHeight: "1em",
            letterSpacing: "0.1em",
          }}
        >
          みらい議会
        </h1>
        <p
          className="font-bold text-black"
          style={{
            fontSize: "16px",
            lineHeight: "2em",
          }}
        >
          国会の議論をわかりやすく
        </p>
      </div>
    </Link>
  );
}
