import { Briefcase, GraduationCap, Home, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type InterviewReportRole, roleLabels } from "../constants";

const roleIcons: Record<InterviewReportRole, LucideIcon> = {
  subject_expert: GraduationCap,
  work_related: Briefcase,
  daily_life_affected: Home,
  general_citizen: User,
};

interface RoleDisplayProps {
  role: string;
}

export function RoleDisplay({ role }: RoleDisplayProps) {
  const RoleIcon = roleIcons[role as InterviewReportRole];

  return (
    <p className="text-sm text-gray-600 flex items-center gap-1">
      {RoleIcon && <RoleIcon size={16} strokeWidth={1.5} />}
      {roleLabels[role as keyof typeof roleLabels] || role}
    </p>
  );
}
