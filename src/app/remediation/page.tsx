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

export default async function RemediationPage() {
  const remediationTasks = await prisma.remediationTask.findMany({
    include: {
      assignedUser: true,
      relatedVulnerability: true,
      relatedAsset: true,
    },
    orderBy: { dueDate: "asc" },
  });

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
              <tr className="border-b border-slate-100" key={task.id}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  {task.title}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.relatedVulnerability.identifier}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.relatedAsset.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {task.assignedUser.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(task.priority)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatDate(task.dueDate)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(task.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
