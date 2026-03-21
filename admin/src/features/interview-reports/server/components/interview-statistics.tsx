import "server-only";

import {
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Star,
  Target,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { InterviewStatistics as InterviewStatisticsType } from "../../shared/types";
import { formatAverageDuration } from "../../shared/utils/format-average-duration";

interface InterviewStatisticsProps {
  statistics: InterviewStatisticsType;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function StanceBar({
  forCount,
  againstCount,
  neutralCount,
}: {
  forCount: number;
  againstCount: number;
  neutralCount: number;
}) {
  const total = forCount + againstCount + neutralCount;
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">データなし</p>;
  }

  const forPct = Math.round((forCount / total) * 100);
  const againstPct = Math.round((againstCount / total) * 100);
  const neutralPct = 100 - forPct - againstPct;

  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full">
        {forPct > 0 && (
          <div className="bg-stance-for" style={{ width: `${forPct}%` }} />
        )}
        {neutralPct > 0 && (
          <div
            className="bg-stance-neutral"
            style={{ width: `${neutralPct}%` }}
          />
        )}
        {againstPct > 0 && (
          <div
            className="bg-stance-against"
            style={{ width: `${againstPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-stance-for" />
          賛成 {forCount}件 ({forPct}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-stance-neutral" />
          中立 {neutralCount}件 ({neutralPct}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-stance-against" />
          反対 {againstCount}件 ({againstPct}%)
        </span>
      </div>
    </div>
  );
}

function RoleDistribution({
  subjectExpert,
  workRelated,
  dailyLifeAffected,
  generalCitizen,
}: {
  subjectExpert: number;
  workRelated: number;
  dailyLifeAffected: number;
  generalCitizen: number;
}) {
  const roles = [
    { label: "専門家", count: subjectExpert, color: "bg-role-subject-expert" },
    { label: "業務関連", count: workRelated, color: "bg-role-work-related" },
    {
      label: "生活影響",
      count: dailyLifeAffected,
      color: "bg-role-daily-life-affected",
    },
    {
      label: "一般市民",
      count: generalCitizen,
      color: "bg-role-general-citizen",
    },
  ];

  const total = roles.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">データなし</p>;
  }

  return (
    <div className="space-y-1.5">
      {roles.map((role) => {
        const pct = Math.round((role.count / total) * 100);
        return (
          <div key={role.label} className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block h-2 w-2 rounded-full ${role.color}`}
            />
            <span className="w-16 text-muted-foreground">{role.label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${role.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-16 text-right text-muted-foreground">
              {role.count}件
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function InterviewStatistics({
  statistics: stats,
}: InterviewStatisticsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="総セッション数"
          value={stats.totalSessions}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="完了済み"
          value={stats.completedSessions}
          sub={`完了率 ${stats.completionRate.toFixed(0)}%`}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="平均満足度"
          value={stats.avgRating != null ? stats.avgRating.toFixed(2) : "-"}
          sub={stats.avgRating != null ? "5段階評価" : undefined}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="平均スコア"
          value={
            stats.avgTotalScore != null ? stats.avgTotalScore.toFixed(1) : "-"
          }
          sub={stats.avgTotalScore != null ? "100点満点" : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="平均メッセージ数"
          value={
            stats.avgMessageCount != null
              ? stats.avgMessageCount.toFixed(1)
              : "-"
          }
          sub="セッションあたり"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="平均所要時間"
          value={formatAverageDuration(stats.avgDurationSeconds)}
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="公開許可"
          value={stats.publicByUserCount}
          sub={`公開率 ${stats.publicRate.toFixed(0)}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="py-4">
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold">スタンス分布</p>
            <StanceBar
              forCount={stats.stanceFor}
              againstCount={stats.stanceAgainst}
              neutralCount={stats.stanceNeutral}
            />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold">役割分布</p>
            <RoleDistribution
              subjectExpert={stats.roleSubjectExpert}
              workRelated={stats.roleWorkRelated}
              dailyLifeAffected={stats.roleDailyLifeAffected}
              generalCitizen={stats.roleGeneralCitizen}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
