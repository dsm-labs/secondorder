type OverdueIndicatorProps = {
  isOverdue: boolean;
};

export default function OverdueIndicator({
  isOverdue,
}: OverdueIndicatorProps) {
  return (
    <StatusBadge
      label={isOverdue ? "Overdue" : "Not Overdue"}
      value={isOverdue ? "OVERDUE" : "NOT_OVERDUE"}
    />
  );
}
import StatusBadge from "@/components/ui/status-badge";
