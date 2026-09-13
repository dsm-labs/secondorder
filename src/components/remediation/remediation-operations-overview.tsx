import Link from "next/link";
import OverdueIndicator from "@/components/remediation/overdue-indicator";
import type {
  OrganizationalRiskLevel,
  RemediationStatus,
} from "@/generated/prisma/client";
import type { RemediationWorkload } from "@/lib/remediation";

type CriticalRemediationItem = {
  assignedUserName: string;
  cvssScore: number;
  dueDate: Date;
  id: string;
  isOverdue: boolean;
  relatedAsset: {
    id: string;
    name: string;
  };
  relatedVulnerability: {
    identifier: string;
    title: string;
  };
  riskRecord: {
    organizationalRiskLevel: OrganizationalRiskLevel;
    organizationalRiskScore: number;
  } | null;
  status: RemediationStatus;
};

type RemediationOperationsOverviewProps = {
  approximateAverageRemediationTimeMs: number | null;
  criticalItems: CriticalRemediationItem[];
  criticalUnresolvedVulnerabilityCount: number;
  openRemediationCount: number;
  overdueTaskCount: number;
  workload: RemediationWorkload[];
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAverageDuration(durationMs: number | null) {
  if (durationMs === null) {
    return "—";
  }

  const averageDays = Math.round((durationMs / (24 * 60 * 60 * 1000)) * 10) / 10;

  return `${averageDays} ${averageDays === 1 ? "day" : "days"}`;
}

export default function RemediationOperationsOverview({
  approximateAverageRemediationTimeMs,
  criticalItems,
  criticalUnresolvedVulnerabilityCount,
  openRemediationCount,
  overdueTaskCount,
  workload,
}: RemediationOperationsOverviewProps) {
  const metrics = [
    {
      label: "Open Remediation",
      note: "Excludes resolved and accepted-risk work.",
      value: openRemediationCount.toString(),
    },
    {
      label: "Overdue Tasks",
      note: "Past due and still unresolved.",
      value: overdueTaskCount.toString(),
    },
    {
      label: "Critical Unresolved Vulnerabilities",
      note: "Unique vulnerabilities with active remediation.",
      value: criticalUnresolvedVulnerabilityCount.toString(),
    },
    {
      label: "Average Remediation Time",
      note: "Approximation from created to last updated for resolved tasks.",
      value: formatAverageDuration(approximateAverageRemediationTimeMs),
    },
  ];

  return (
    <div className="space-y-8 border-b border-slate-200 pb-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={metric.label}
          >
            <p className="text-sm font-medium text-slate-600">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {metric.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {metric.note}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Critical Unresolved Work
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Highest-priority active tasks ranked by stored organizational risk,
            CVSS, and remediation priority.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Vulnerability
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Related Asset
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Organizational Risk
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Assigned To
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Due Date
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Task Status
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Due State
                </th>
              </tr>
            </thead>
            <tbody>
              {criticalItems.map((item) => (
                <tr className="border-b border-slate-100" key={item.id}>
                  <td className="px-3 py-4 text-slate-600">
                    <Link
                      className="font-medium text-slate-950 underline-offset-4 hover:underline"
                      href={`/remediation/${item.id}`}
                    >
                      {item.relatedVulnerability.identifier}: {item.relatedVulnerability.title}
                    </Link>
                    <span className="mt-1 block text-xs text-slate-500">
                      CVSS {item.cvssScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/assets/${item.relatedAsset.id}`}
                    >
                      {item.relatedAsset.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.riskRecord
                      ? `${item.riskRecord.organizationalRiskScore.toFixed(2)} / ${formatEnum(item.riskRecord.organizationalRiskLevel)}`
                      : "Not assessed"}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.assignedUserName}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(item.status)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <OverdueIndicator isOverdue={item.isOverdue} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {criticalItems.length === 0 ? (
            <p className="py-5 text-sm text-slate-500">
              No critical vulnerabilities currently have unresolved remediation
              work.
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Remediation Workload
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Active task load by assigned user, excluding resolved and
            accepted-risk work.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Assigned User
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Department
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Unresolved
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Critical Priority
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  High Priority
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Overdue
                </th>
              </tr>
            </thead>
            <tbody>
              {workload.map((item) => (
                <tr className="border-b border-slate-100" key={item.userId}>
                  <td className="px-3 py-4 font-medium text-slate-950">
                    {item.userName}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.departmentName ?? "Not specified"}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.totalUnresolvedTasks}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.criticalPriorityCount}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.highPriorityCount}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {item.overdueCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {workload.length === 0 ? (
            <p className="py-5 text-sm text-slate-500">
              No users currently have unresolved remediation work.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
