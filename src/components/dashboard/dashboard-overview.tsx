import Link from "next/link";
import type { UserRole } from "@/generated/prisma/client";
import {
  getDashboardRoleView,
  type DashboardMetricKey,
  type DashboardSectionKey,
  type DashboardSummary,
} from "@/lib/dashboard";
import { hasPermission, Permission } from "@/lib/permissions";

type DashboardOverviewProps = {
  role: UserRole;
  summary: DashboardSummary;
};

type MetricDefinition = {
  href: string;
  label: string;
  note: string;
};

const metricDefinitions: Record<DashboardMetricKey, MetricDefinition> = {
  totalAssets: {
    href: "/assets",
    label: "Total Assets",
    note: "Active and inactive assets, excluding archived records.",
  },
  openVulnerabilities: {
    href: "/vulnerabilities",
    label: "Open Vulnerabilities",
    note: "Findings that are open or in review.",
  },
  criticalHighVulnerabilities: {
    href: "/vulnerabilities",
    label: "Critical / High Vulnerabilities",
    note: "Active findings with elevated technical severity.",
  },
  criticalRisks: {
    href: "/risks?riskLevel=CRITICAL",
    label: "Critical Organizational Risks",
    note: "Critical stored assessments that remain unresolved.",
  },
  openRemediation: {
    href: "/remediation",
    label: "Open Remediation",
    note: "Tasks not resolved or accepted as risk.",
  },
  overdueRemediation: {
    href: "/remediation?overdue=overdue",
    label: "Overdue Remediation",
    note: "Unresolved tasks past their due date.",
  },
  internetFacingAssets: {
    href: "/assets",
    label: "Internet-Facing Assets",
    note: "Non-archived assets exposed to the internet.",
  },
};

const metricPermissions: Record<DashboardMetricKey, Permission> = {
  totalAssets: Permission.VIEW_ASSETS,
  openVulnerabilities: Permission.VIEW_VULNERABILITIES,
  criticalHighVulnerabilities: Permission.VIEW_VULNERABILITIES,
  criticalRisks: Permission.VIEW_RISKS,
  openRemediation: Permission.VIEW_REMEDIATION,
  overdueRemediation: Permission.VIEW_REMEDIATION,
  internetFacingAssets: Permission.VIEW_ASSETS,
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function BarRow({
  barClassName,
  label,
  percent,
  value,
}: {
  barClassName: string;
  label: string;
  percent: number;
  value: string;
}) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">{value}</span>
      </div>
      <div
        aria-label={`${label}: ${value}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(safePercent)}
        className="h-2 overflow-hidden rounded-sm bg-slate-200"
        role="progressbar"
      >
        <div
          className={`h-full rounded-sm ${barClassName}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

function RiskByDepartment({
  summary,
  canViewRisks,
}: DashboardOverviewProps & { canViewRisks: boolean }) {
  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Organizational Risk by Department"
        description="Current unresolved stored assessments on non-archived assets, ranked by peak and average score."
      />
      <div className="mt-5 space-y-5">
        {summary.riskByDepartment.slice(0, 6).map((department) => (
          <div key={department.departmentId}>
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                {canViewRisks ? (
                  <Link
                    className="font-medium text-slate-900 underline-offset-4 hover:underline"
                    href={`/risks?departmentId=${department.departmentId}`}
                  >
                    {department.departmentName}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-900">
                    {department.departmentName}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-slate-500">
                  {department.riskCount} current risk
                  {department.riskCount === 1 ? "" : "s"}; {department.criticalHighRiskCount} high or critical
                </p>
              </div>
              <p className="shrink-0 text-sm text-slate-600">
                Peak {department.highestScore.toFixed(2)}
              </p>
            </div>
            <div
              aria-label={`${department.departmentName} peak risk score`}
              aria-valuemax={10}
              aria-valuemin={0}
              aria-valuenow={department.highestScore}
              className="h-2 overflow-hidden rounded-sm bg-slate-200"
              role="progressbar"
            >
              <div
                className="h-full rounded-sm bg-rose-700"
                style={{ width: `${Math.min(100, department.highestScore * 10)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Average {department.averageScore.toFixed(2)}
            </p>
          </div>
        ))}
        {summary.riskByDepartment.length === 0 ? (
          <p className="text-sm text-slate-500">
            No current organizational risks are available by department.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function VulnerabilitiesBySeverity({ summary }: DashboardOverviewProps) {
  const total = summary.metrics.openVulnerabilities;
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-700",
    HIGH: "bg-orange-600",
    MEDIUM: "bg-amber-500",
    LOW: "bg-sky-600",
  };

  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Vulnerabilities by Severity"
        description="Technical severity distribution for findings that are open or in review."
      />
      <div className="mt-5 space-y-4">
        {summary.vulnerabilitiesBySeverity.map((item) => (
          <BarRow
            barClassName={colors[item.severity]}
            key={item.severity}
            label={formatEnum(item.severity)}
            percent={total === 0 ? 0 : (item.count / total) * 100}
            value={item.count.toString()}
          />
        ))}
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No open or in-review vulnerabilities are currently recorded.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function RemediationProgress({ summary }: DashboardOverviewProps) {
  const total = summary.remediationProgress.reduce(
    (count, item) => count + item.count,
    0
  );
  const colors: Record<string, string> = {
    active: "bg-blue-700",
    awaitingValidation: "bg-violet-600",
    resolved: "bg-emerald-700",
    acceptedRisk: "bg-slate-500",
  };

  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Remediation Progress"
        description="Current task distribution across active work, validation, resolution, and accepted risk."
      />
      <div className="mt-5 space-y-4">
        {summary.remediationProgress.map((item) => (
          <BarRow
            barClassName={colors[item.key]}
            key={item.key}
            label={item.label}
            percent={total === 0 ? 0 : (item.count / total) * 100}
            value={item.count.toString()}
          />
        ))}
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No remediation tasks are currently recorded.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ExposureSummary({ summary }: DashboardOverviewProps) {
  const exposure = summary.exposureSummary;

  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Asset Exposure Summary"
        description="Internet-facing and internal assets, excluding archived records."
      />
      <div className="mt-5 space-y-4">
        <BarRow
          barClassName="bg-orange-600"
          label="Internet-Facing"
          percent={exposure.internetFacingPercentage}
          value={exposure.internetFacing.toString()}
        />
        <BarRow
          barClassName="bg-slate-600"
          label="Internal / Not Internet-Facing"
          percent={
            exposure.total === 0 ? 0 : (exposure.internal / exposure.total) * 100
          }
          value={exposure.internal.toString()}
        />
        <p className="text-xs text-slate-500">
          {exposure.total === 0
            ? "No active asset exposure data is available."
            : `${exposure.internetFacingPercentage}% of non-archived assets are internet-facing.`}
        </p>
      </div>
    </section>
  );
}

function HighestRiskAssets({
  summary,
  canViewAssets,
  canViewRisks,
}: DashboardOverviewProps & {
  canViewAssets: boolean;
  canViewRisks: boolean;
}) {
  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Highest-Risk Assets"
        description="Non-archived assets ranked by highest stored current risk score, then elevated-risk count."
      />
      <ol className="mt-4 divide-y divide-slate-100">
        {summary.highestRiskAssets.slice(0, 5).map((asset, index) => {
          const href = canViewAssets
            ? `/assets/${asset.assetId}`
            : canViewRisks
              ? `/risks/${asset.highestRiskRecordId}`
              : null;

          return (
            <li className="flex items-start gap-3 py-3" key={asset.assetId}>
              <span className="w-7 shrink-0 text-sm font-semibold text-slate-400">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link
                    className="break-words font-medium text-slate-950 underline-offset-4 hover:underline"
                    href={href}
                  >
                    {asset.assetName}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-950">{asset.assetName}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {asset.departmentName} | {asset.riskCount} current risk
                  {asset.riskCount === 1 ? "" : "s"} | {asset.criticalHighRiskCount} high or critical
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-900">
                {asset.highestRiskScore.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ol>
      {summary.highestRiskAssets.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No current assessed risks are associated with non-archived assets.
        </p>
      ) : null}
    </section>
  );
}

function HighestRiskVulnerabilities({
  summary,
  canViewVulnerabilities,
  canViewRisks,
}: DashboardOverviewProps & {
  canViewVulnerabilities: boolean;
  canViewRisks: boolean;
}) {
  return (
    <section className="border-t border-slate-200 pt-6">
      <SectionHeading
        title="Highest-Risk Vulnerabilities"
        description="Active findings ranked by their existing stored organizational risk assessment."
      />
      <ol className="mt-4 divide-y divide-slate-100">
        {summary.highestRiskVulnerabilities.slice(0, 5).map((item, index) => {
          const href = canViewVulnerabilities
            ? `/vulnerabilities/${item.vulnerabilityId}`
            : canViewRisks
              ? `/risks/${item.riskRecordId}`
              : null;

          return (
            <li className="flex items-start gap-3 py-3" key={item.riskRecordId}>
              <span className="w-7 shrink-0 text-sm font-semibold text-slate-400">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link
                    className="font-medium text-slate-950 underline-offset-4 hover:underline"
                    href={href}
                  >
                    {item.identifier}: {item.title}
                  </Link>
                ) : (
                  <p className="font-medium text-slate-950">
                    {item.identifier}: {item.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  CVSS {item.cvssScore.toFixed(1)} | {formatEnum(item.severity)} | {formatEnum(item.riskLevel)} risk
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-slate-900">
                {item.riskScore.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ol>
      {summary.highestRiskVulnerabilities.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No active vulnerabilities currently have a current stored risk record.
        </p>
      ) : null}
    </section>
  );
}

function RemediationWorkload({ summary }: DashboardOverviewProps) {
  return (
    <section className="border-t border-slate-200 pt-6 xl:col-span-2">
      <SectionHeading
        title="Remediation Workload"
        description="Active assignment load by employee, excluding resolved and accepted-risk tasks."
      />
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[720px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-3 font-semibold">Assigned User</th>
              <th className="px-3 py-3 font-semibold">Department</th>
              <th className="px-3 py-3 font-semibold">Unresolved</th>
              <th className="px-3 py-3 font-semibold">Critical</th>
              <th className="px-3 py-3 font-semibold">High</th>
              <th className="px-3 py-3 font-semibold">Overdue</th>
            </tr>
          </thead>
          <tbody>
            {summary.remediationWorkload.map((item) => (
              <tr className="border-b border-slate-100" key={item.userId}>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {item.userName}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.departmentName ?? "Not specified"}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.totalUnresolvedTasks}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.criticalPriorityCount}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.highPriorityCount}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.overdueCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {summary.remediationWorkload.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">
            No employees currently have active remediation work.
          </p>
        ) : null}
      </div>
    </section>
  );
}

export default function DashboardOverview({
  role,
  summary,
}: DashboardOverviewProps) {
  const view = getDashboardRoleView(role);
  const canViewAssets = hasPermission(role, Permission.VIEW_ASSETS);
  const canViewRisks = hasPermission(role, Permission.VIEW_RISKS);
  const canViewVulnerabilities = hasPermission(
    role,
    Permission.VIEW_VULNERABILITIES
  );

  function renderSection(section: DashboardSectionKey) {
    if (section === "riskByDepartment") {
      return (
        <RiskByDepartment
          canViewRisks={canViewRisks}
          role={role}
          summary={summary}
        />
      );
    }

    if (section === "vulnerabilitiesBySeverity") {
      return <VulnerabilitiesBySeverity role={role} summary={summary} />;
    }

    if (section === "remediationProgress") {
      return <RemediationProgress role={role} summary={summary} />;
    }

    if (section === "highestRiskAssets") {
      return (
        <HighestRiskAssets
          canViewAssets={canViewAssets}
          canViewRisks={canViewRisks}
          role={role}
          summary={summary}
        />
      );
    }

    if (section === "highestRiskVulnerabilities") {
      return (
        <HighestRiskVulnerabilities
          canViewRisks={canViewRisks}
          canViewVulnerabilities={canViewVulnerabilities}
          role={role}
          summary={summary}
        />
      );
    }

    if (section === "exposureSummary") {
      return <ExposureSummary role={role} summary={summary} />;
    }

    return <RemediationWorkload role={role} summary={summary} />;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {view.metrics.map((metricKey) => {
          const definition = metricDefinitions[metricKey];
          const canNavigate = hasPermission(role, metricPermissions[metricKey]);
          const content = (
            <>
              <p className="text-sm font-medium text-slate-600">
                {definition.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {summary.metrics[metricKey]}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {definition.note}
              </p>
            </>
          );
          const className =
            "h-full min-h-36 rounded-md border border-slate-200 bg-slate-50 p-4 transition";

          return canNavigate ? (
            <Link
              className={`${className} hover:border-slate-400 hover:bg-white`}
              href={definition.href}
              key={metricKey}
            >
              {content}
            </Link>
          ) : (
            <div className={className} key={metricKey}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid gap-x-8 gap-y-8 xl:grid-cols-2">
        {view.sections.map((section) => (
          <div
            className={section === "remediationWorkload" ? "xl:col-span-2" : ""}
            key={section}
          >
            {renderSection(section)}
          </div>
        ))}
      </div>
    </div>
  );
}
