import { type InterviewReportRole, roleIcons, roleLabels } from "../constants";

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
