import { Container } from "@/components/layouts/container";
import { Progress } from "@/components/ui/progress";
import { formatDateWithDots } from "@/lib/utils/date";
import type { DietSession } from "../../shared/types";
import { calculateSessionProgress } from "../../shared/utils/session-progress";

type CurrentDietSessionProps = {
  session: DietSession | null;
  /** 直近で閉会した会期。閉会中に「終了しました」を出すために使う。 */
  closedSession: DietSession | null;
  /** 進行率の基準時刻。呼び出し側が日本時刻を渡す。 */
  now: Date;
};

/**
 * 今国会の状況カード。
 *
 * 会期中は進行バーと残り日数を出す。パーセンテージだけだと寄付の目標額のように
 * 読まれるため、召集日と閉会予定日を併記する。
 * 閉会中はバーを出さず、どの会期が終わったのかをテキストで示す。
 */
export function CurrentDietSession({
  session,
  closedSession,
  now,
}: CurrentDietSessionProps) {
  const inSession = session !== null;

  // ヒーローを外したのでこのカードが最上部に来る。ヘッダーは fixed で
  // main-layout の上余白は md 以上にしか効かないため、モバイルでは
  // ここで余白を確保する（パンくずを持つページと同じ規約）。
  return (
    <Container className="pt-24 md:pt-5">
      <div className="flex flex-col gap-6 rounded-2xl bg-mirai-light-gradient px-5 py-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              inSession ? "bg-mirai-brand-teal" : "bg-mirai-border-light"
            }`}
            aria-hidden
          />
          <span className="whitespace-nowrap text-xl font-bold">本日は</span>
          {/* 会期中は状態そのものを目立たせ、閉会中は落ち着かせる。 */}
          <span
            className={`rounded-full px-3.5 py-1 text-[15px] font-bold ${
              inSession
                ? "bg-mirai-gradient text-mirai-text"
                : "bg-mirai-surface-muted text-mirai-text-secondary"
            }`}
          >
            {inSession ? "国会会期中" : "国会閉会中"}
          </span>
          {inSession && (
            <span className="text-[15px] font-bold text-mirai-brand-teal-deep md:ml-auto">
              {session.name}
            </span>
          )}
        </div>

        {inSession && <SessionProgressBar session={session} now={now} />}
        {!inSession && closedSession && (
          <ClosedSessionSummary session={closedSession} />
        )}
      </div>
    </Container>
  );
}

function SessionProgressBar({
  session,
  now,
}: {
  session: DietSession;
  now: Date;
}) {
  const { percentage, daysLeft } = calculateSessionProgress(session, now);

  return (
    <div className="-mt-1.5 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-bold text-mirai-text-secondary">
          会期の進行
        </span>
        <span className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-[13px] font-bold text-mirai-text-secondary">
            閉会まで
          </span>
          {/* 残り日数だけ色を変える。会期の進行のうち一番見たい数字。 */}
          <span className="font-lexend text-[28px] font-bold leading-none text-primary-accent">
            {daysLeft}
          </span>
          <span className="text-[13px] font-bold text-primary-accent">日</span>
        </span>
      </div>

      {/*
        残り日数は上の行に文字で出しているので、バー自体は割合だけを伝える。
      */}
      <Progress
        value={percentage}
        aria-label="会期の進行"
        className="h-2.5 bg-white/75 [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-primary-accent [&>[data-slot=progress-indicator]]:to-mirai-gradient-start"
      />

      {/* パーセンテージ単独だと目標額のように読まれるので、日付を両端に置く。 */}
      <div className="flex items-baseline justify-between gap-2 text-xs font-bold text-mirai-text-secondary">
        <span className="whitespace-nowrap">
          {formatDateWithDots(session.start_date)} 召集
        </span>
        <span className="whitespace-nowrap">
          {formatDateWithDots(session.end_date)} 閉会予定
        </span>
      </div>
    </div>
  );
}

function ClosedSessionSummary({ session }: { session: DietSession }) {
  return (
    <div className="-mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <span className="text-[15px] font-bold text-mirai-brand-teal-deep">
        {session.name}は終了しました
      </span>
      <span className="whitespace-nowrap text-[13px] font-bold text-mirai-text-secondary">
        / {formatDateWithDots(session.start_date)} -{" "}
        {formatDateWithDots(session.end_date)}
      </span>
    </div>
  );
}
