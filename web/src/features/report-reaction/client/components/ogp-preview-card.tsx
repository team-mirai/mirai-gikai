"use client";

interface OgpPreviewCardProps {
  ogImageUrl: string;
  billName: string;
}

export function OgpPreviewCard({ ogImageUrl, billName }: OgpPreviewCardProps) {
  return (
    <div className="w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ogImageUrl}
        alt={`${billName}に対する意見のOGP画像`}
        className="w-full"
      />
    </div>
  );
}
