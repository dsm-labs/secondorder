type RiskFreshnessIndicatorProps = {
  isCurrent: boolean;
  label: string;
};

export default function RiskFreshnessIndicator({
  isCurrent,
  label,
}: RiskFreshnessIndicatorProps) {
  return (
    <span
      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-medium ${
        isCurrent
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {label}
    </span>
  );
}
