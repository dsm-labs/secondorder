type RiskFreshnessIndicatorProps = {
  isCurrent: boolean;
  label: string;
};

export default function RiskFreshnessIndicator({
  isCurrent,
  label,
}: RiskFreshnessIndicatorProps) {
  return (
    <StatusBadge
      label={label}
      tone={isCurrent ? "neutral" : "warning"}
      value={isCurrent ? "CURRENT" : "NEEDS_REASSESSMENT"}
    />
  );
}
import StatusBadge from "@/components/ui/status-badge";
