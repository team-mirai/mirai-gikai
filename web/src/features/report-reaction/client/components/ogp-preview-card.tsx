"use client";

const PREVIEW_SUMMARY_MAX_LENGTH = 100;
const PREVIEW_BILL_NAME_MAX_LENGTH = 30;

interface OgpPreviewCardProps {
  summary: string | null;
  billName: string;
}

export function OgpPreviewCard({ summary, billName }: OgpPreviewCardProps) {
  const truncatedSummary =
    summary && summary.length > PREVIEW_SUMMARY_MAX_LENGTH
      ? `${summary.slice(0, PREVIEW_SUMMARY_MAX_LENGTH)}...`
      : summary;

  const truncatedBillName =
    billName.length > PREVIEW_BILL_NAME_MAX_LENGTH
      ? `${billName.slice(0, PREVIEW_BILL_NAME_MAX_LENGTH)}...`
      : billName;

  return (
    <div
      className="w-full overflow-hidden rounded-lg"
      style={{
        backgroundImage:
          "linear-gradient(177deg, rgb(226, 246, 243) 0%, rgb(238, 246, 226) 100%)",
      }}
    >
      <div className="relative mx-auto my-3 rounded-lg border-2 border-mirai-gradient-end bg-white px-4 py-4">
        {/* サマリーテキスト */}
        {truncatedSummary && (
          <p className="text-xs leading-relaxed text-mirai-text">
            {truncatedSummary}
          </p>
        )}

        {/* 法案名 */}
        <p className="mt-2 text-[10px] font-bold leading-relaxed text-primary-accent">
          {truncatedBillName}
        </p>

        {/* みらい議会バッジ */}
        <div
          className="absolute top-0 right-0 rounded-bl-lg rounded-tr-lg px-2 py-1"
          style={{
            backgroundImage:
              "linear-gradient(-30deg, rgb(188, 236, 211) 1%, rgb(100, 216, 198) 99%)",
          }}
        >
          <span className="text-[8px] font-bold tracking-wider text-mirai-text">
            みらい議会
          </span>
        </div>

        {/* ロゴテキスト */}
        <div className="absolute right-3 bottom-2 flex flex-col items-end">
          <span className="text-[7px] font-bold tracking-widest text-primary-accent">
            チーム
          </span>
          <span className="text-[9px] font-bold tracking-widest text-primary-accent">
            みらい
          </span>
        </div>
      </div>
    </div>
  );
}
