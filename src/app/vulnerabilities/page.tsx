import PageSection from "@/components/page-section";

const vulnerabilities = [
  {
    cve: "CVE-DEMO-001",
    vulnerability: "Remote code execution exposure",
    cvssScore: "9.8",
    severity: "Critical",
    affectedAsset: "Customer Portal",
    detectionDate: "2026-08-12",
    status: "Open"
  },
  {
    cve: "CVE-DEMO-002",
    vulnerability: "Database authentication bypass",
    cvssScore: "9.1",
    severity: "Critical",
    affectedAsset: "Finance Database",
    detectionDate: "2026-08-10",
    status: "Open"
  },
  {
    cve: "CVE-DEMO-003",
    vulnerability: "Outdated secure shell service",
    cvssScore: "8.1",
    severity: "High",
    affectedAsset: "HR File Share",
    detectionDate: "2026-08-09",
    status: "In Review"
  },
  {
    cve: "CVE-DEMO-004",
    vulnerability: "Endpoint configuration weakness",
    cvssScore: "5.9",
    severity: "Medium",
    affectedAsset: "Workstation Pool A",
    detectionDate: "2026-08-05",
    status: "Accepted Risk"
  }
];

export default function VulnerabilitiesPage() {
  return (
    <PageSection
      title="Vulnerabilities"
      subtitle="This section will eventually show vulnerability findings."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                CVE
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Vulnerability
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                CVSS Score
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Severity
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Affected Asset
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Detection Date
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {vulnerabilities.map((item) => (
              <tr className="border-b border-slate-100" key={item.cve}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {item.cve}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.vulnerability}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.cvssScore}
                </td>
                <td className="px-3 py-4 text-slate-600">{item.severity}</td>
                <td className="px-3 py-4 text-slate-600">
                  {item.affectedAsset}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.detectionDate}
                </td>
                <td className="px-3 py-4 text-slate-600">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
