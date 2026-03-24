import {
  formatRoleLabel,
  type InterviewReportRole,
  roleIcons,
} from "../constants";

interface RoleDisplayProps {
  role?: string | null;
  roleTitle?: string | null;
}

export function RoleDisplay({ role, roleTitle }: RoleDisplayProps) {
  const RoleIcon = role ? roleIcons[role as InterviewReportRole] : undefined;

  return (
    <p className="text-xs text-gray-600 flex items-center gap-1">
      {RoleIcon && <RoleIcon size={16} strokeWidth={1.5} />}
      {formatRoleLabel(role, roleTitle)}
    </p>
  );
}
