export function TeamMirai() {
  return (
    <div className="py-10">
      <div className="flex flex-col gap-6">
        {/* ヘッダー */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-black">
            やぎーん（草津市議会議員）
          </h2>
          <p className="text-sm font-bold text-primary-accent">
            このサイトについて
          </p>
        </div>

        {/* コンテンツ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] leading-[28px] text-black">
              草津市議会議員のやぎーんが、チームみらいのOSS「みらい議会」をForkして作成した草津市議会版サイトです。これは政党チームみらいが運営しているものではありません。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
