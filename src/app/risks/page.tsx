import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function RisksPage() {
  const risks = await prisma.riskRecord.findMany({
    include: {
      vulnerability: {
        include: {
          affectedAsset: true,
        },
      },
    },
    orderBy: { organizationalRiskScore: "desc" },
  });

  return (
    <PageSection
      title="Risks"
      subtitle="This section will eventually connect technical findings to business risk."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Risk
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Related Asset
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Technical Severity
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Business Criticality
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Internet Exposure
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Organizational Risk
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr className="border-b border-slate-100" key={risk.id}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {risk.vulnerability.title}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.vulnerability.affectedAsset.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(risk.vulnerability.severity)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(risk.vulnerability.affectedAsset.businessCriticality)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.vulnerability.affectedAsset.internetExposure ? "Yes" : "No"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(risk.organizationalRiskLevel)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(risk.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
