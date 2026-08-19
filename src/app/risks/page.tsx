import PageSection from "@/components/page-section";

const risks = [
  {
    risk: "Customer portal remote access exposure",
    relatedAsset: "Customer Portal",
    technicalSeverity: "Critical",
    businessCriticality: "Critical",
    internetExposure: "Yes",
    organizationalRisk: "Critical",
    status: "Open"
  },
  {
    risk: "Finance database authentication weakness",
    relatedAsset: "Finance Database",
    technicalSeverity: "Critical",
    businessCriticality: "Critical",
    internetExposure: "No",
    organizationalRisk: "High",
    status: "Open"
  },
  {
    risk: "HR file share outdated service",
    relatedAsset: "HR File Share",
    technicalSeverity: "High",
    businessCriticality: "High",
    internetExposure: "No",
    organizationalRisk: "High",
    status: "In Review"
  },
  {
    risk: "Endpoint configuration weakness",
    relatedAsset: "Workstation Pool A",
    technicalSeverity: "Medium",
    businessCriticality: "Medium",
    internetExposure: "No",
    organizationalRisk: "Medium",
    status: "Accepted Risk"
  }
];

export default function RisksPage() {
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
              <tr className="border-b border-slate-100" key={risk.risk}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {risk.risk}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.relatedAsset}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.technicalSeverity}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.businessCriticality}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.internetExposure}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {risk.organizationalRisk}
                </td>
                <td className="px-3 py-4 text-slate-600">{risk.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
