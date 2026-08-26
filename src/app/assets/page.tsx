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

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({
    include: {
      department: true,
      owner: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <PageSection
      title="Assets"
      subtitle="This section will eventually track the systems SecondOrder manages."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Asset Name
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Asset Type
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                IP Address
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Operating System
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Department
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Business Criticality
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Internet Exposure
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr className="border-b border-slate-100" key={asset.name}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {asset.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.assetType}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.ipAddress ?? "Not specified"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.operatingSystem ?? "Not specified"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.department.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(asset.businessCriticality)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.internetExposure ? "Yes" : "No"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(asset.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
