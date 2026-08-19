import PageSection from "@/components/page-section";

const assets = [
  {
    name: "Customer Portal",
    type: "Web Application",
    ipAddress: "10.20.14.12",
    operatingSystem: "Ubuntu Server 22.04",
    department: "Sales",
    businessCriticality: "Critical",
    internetExposure: "Yes",
    status: "Active"
  },
  {
    name: "Finance Database",
    type: "Database Server",
    ipAddress: "10.20.30.8",
    operatingSystem: "PostgreSQL on Linux",
    department: "Finance",
    businessCriticality: "Critical",
    internetExposure: "No",
    status: "Active"
  },
  {
    name: "HR File Share",
    type: "File Server",
    ipAddress: "10.20.22.15",
    operatingSystem: "Windows Server 2022",
    department: "Human Resources",
    businessCriticality: "High",
    internetExposure: "No",
    status: "Active"
  },
  {
    name: "Workstation Pool A",
    type: "Endpoint Group",
    ipAddress: "10.20.40.0/24",
    operatingSystem: "Windows 11 Enterprise",
    department: "Operations",
    businessCriticality: "Medium",
    internetExposure: "No",
    status: "Active"
  }
];

export default function AssetsPage() {
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
                <td className="px-3 py-4 text-slate-600">{asset.type}</td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.ipAddress}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.operatingSystem}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.department}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.businessCriticality}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.internetExposure}
                </td>
                <td className="px-3 py-4 text-slate-600">{asset.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
