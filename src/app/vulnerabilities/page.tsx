import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function VulnerabilitiesPage() {
  const vulnerabilities = await prisma.vulnerability.findMany({
    include: {
      affectedAsset: true,
    },
    orderBy: { detectionDate: "desc" },
  });

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
              <tr className="border-b border-slate-100" key={item.id}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {item.identifier}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.title}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.cvssScore.toString()}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(item.severity)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.affectedAsset.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatDate(item.detectionDate)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(item.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
