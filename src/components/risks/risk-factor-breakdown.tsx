import type { RiskFactorContribution } from "@/lib/risk-engine";

type RiskFactorBreakdownProps = {
  factors: RiskFactorContribution[];
  finalScore: number;
};

function formatWeight(weight: number) {
  return `${Math.round(weight * 100)}%`;
}

function formatScore(value: number) {
  return value.toFixed(2);
}

function formatContribution(value: number) {
  return value.toFixed(3).replace(/0$/, "");
}

export default function RiskFactorBreakdown({
  factors,
  finalScore,
}: RiskFactorBreakdownProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              Factor
            </th>
            <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              Actual Value
            </th>
            <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              Normalized
            </th>
            <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              Weight
            </th>
            <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
              Contribution
            </th>
          </tr>
        </thead>
        <tbody>
          {factors.map((factor) => (
            <tr className="border-b border-slate-100" key={factor.factor}>
              <td className="px-3 py-4 font-medium text-slate-900">
                {factor.factor}
              </td>
              <td className="px-3 py-4 text-slate-600">{factor.rawValue}</td>
              <td className="px-3 py-4 text-slate-600">
                {formatScore(factor.normalizedScore)}
              </td>
              <td className="px-3 py-4 text-slate-600">
                {formatWeight(factor.weight)}
              </td>
              <td className="px-3 py-4 text-slate-600">
                {formatContribution(factor.weightedScore)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th
              className="px-3 py-4 text-sm font-semibold text-slate-950"
              colSpan={4}
              scope="row"
            >
              Final Organizational Risk Score
            </th>
            <td className="px-3 py-4 text-sm font-semibold text-slate-950">
              {formatScore(finalScore)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
