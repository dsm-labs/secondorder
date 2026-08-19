import PageSection from "@/components/page-section";

const remediationTasks = [
  {
    task: "Patch customer portal runtime",
    relatedVulnerability: "CVE-DEMO-001",
    relatedAsset: "Customer Portal",
    assignedTo: "Web Platform Team",
    priority: "High",
    dueDate: "2026-08-23",
    status: "Open"
  },
  {
    task: "Review database access controls",
    relatedVulnerability: "CVE-DEMO-002",
    relatedAsset: "Finance Database",
    assignedTo: "Database Admin Team",
    priority: "High",
    dueDate: "2026-08-25",
    status: "In Progress"
  },
  {
    task: "Upgrade file share SSH service",
    relatedVulnerability: "CVE-DEMO-003",
    relatedAsset: "HR File Share",
    assignedTo: "Infrastructure Team",
    priority: "Medium",
    dueDate: "2026-08-28",
    status: "Awaiting Validation"
  },
  {
    task: "Harden endpoint baseline",
    relatedVulnerability: "CVE-DEMO-004",
    relatedAsset: "Workstation Pool A",
    assignedTo: "Desktop Support",
    priority: "Medium",
    dueDate: "2026-09-02",
    status: "Accepted Risk"
  }
];

export default function RemediationPage() {
  return (
    <PageSection
      title="Remediation"
      subtitle="This section will eventually support remediation work tracking."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Task
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Related Vulnerability
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Related Asset
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Assigned To
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Priority
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Due Date
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {remediationTasks.map((task) => (
              <tr className="border-b border-slate-100" key={task.task}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {task.task}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.relatedVulnerability}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.relatedAsset}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.assignedTo}
                </td>
                <td className="px-3 py-4 text-slate-600">{task.priority}</td>
                <td className="px-3 py-4 text-slate-600">{task.dueDate}</td>
                <td className="px-3 py-4 text-slate-600">{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
