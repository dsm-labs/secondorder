type StatusTone = "danger" | "warning" | "success" | "info" | "neutral";

type StatusBadgeProps = {
  label?: string;
  tone?: StatusTone;
  value: string;
};

const toneClasses: Record<StatusTone, string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-sky-200 bg-sky-50 text-sky-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const toneByValue: Record<string, StatusTone> = {
  ACCEPTED_RISK: "neutral",
  ACTIVE: "success",
  ARCHIVED: "neutral",
  ASSIGN: "info",
  AWAITING_VALIDATION: "warning",
  CREATE: "success",
  CRITICAL: "danger",
  DELETE: "danger",
  DUPLICATE: "neutral",
  HIGH: "danger",
  IN_PROGRESS: "info",
  IN_REVIEW: "info",
  INACTIVE: "neutral",
  INVALID: "danger",
  LOGIN: "success",
  LOGOUT: "neutral",
  LOW: "neutral",
  MEDIUM: "warning",
  NOT_OVERDUE: "neutral",
  OPEN: "info",
  OVERDUE: "danger",
  READY: "success",
  RESOLVED: "success",
  STATUS_CHANGE: "info",
  UNMATCHED_ASSET: "warning",
  UPDATE: "info",
};

export function formatStatusLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StatusBadge({
  label,
  tone,
  value,
}: StatusBadgeProps) {
  const resolvedTone = tone ?? toneByValue[value] ?? "neutral";

  return (
    <span
      className={`inline-flex w-fit whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium ${toneClasses[resolvedTone]}`}
    >
      {label ?? formatStatusLabel(value)}
    </span>
  );
}
