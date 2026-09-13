type OverdueIndicatorProps = {
  isOverdue: boolean;
};

export default function OverdueIndicator({
  isOverdue,
}: OverdueIndicatorProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${
        isOverdue
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {isOverdue ? "Overdue" : "Not Overdue"}
    </span>
  );
}
