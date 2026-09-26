import Link from "next/link";
import OverdueIndicator from "@/components/remediation/overdue-indicator";
import StatusBadge from "@/components/ui/status-badge";
import type { UserRole } from "@/generated/prisma/client";
import type { DashboardMetricKey } from "@/lib/dashboard";
import { hasPermission, Permission } from "@/lib/permissions";
import {
  getReportRoleView,
  type ReportSectionKey,
  type ReportSummary,
} from "@/lib/reports";

type ReportsWorkspaceProps = {
  generatedAt: Date;
  role: UserRole;
  summary: ReportSummary;
};

const metricDefinitions: Record<
  DashboardMetricKey,
  { href: string; label: string; note: string; permission: Permission }
> = {
  totalAssets: {
    href: "/assets",
    label: "Total Assets",
    note: "Excludes archived assets.",
    permission: Permission.VIEW_ASSETS,
  },
  openVulnerabilities: {
    href: "/vulnerabilities",
    label: "Open Vulnerabilities",
    note: "Open or in-review findings.",
    permission: Permission.VIEW_VULNERABILITIES,
  },
  criticalHighVulnerabilities: {
    href: "/vulnerabilities",
    label: "Critical / High Findings",
    note: "Active elevated-severity findings.",
    permission: Permission.VIEW_VULNERABILITIES,
  },
  criticalRisks: {
    href: "/risks?riskLevel=CRITICAL",
    label: "Critical Organizational Risks",
    note: "Unresolved critical assessments.",
    permission: Permission.VIEW_RISKS,
  },
  openRemediation: {
    href: "/remediation",
    label: "Open Remediation",
    note: "Unresolved remediation tasks.",
    permission: Permission.VIEW_REMEDIATION,
  },
  overdueRemediation: {
    href: "/remediation?overdue=overdue",
    label: "Overdue Remediation",
    note: "Past due and unresolved.",
    permission: Permission.VIEW_REMEDIATION,
  },
  internetFacingAssets: {
    href: "/assets",
    label: "Internet-Facing Assets",
    note: "Exposed non-archived assets.",
    permission: Permission.VIEW_ASSETS,
  },
};

const roleNarratives: Record<UserRole, string> = {
  EXECUTIVE:
    "Business-facing concentration of organizational risk, exposure, and remediation performance.",
  ANALYST:
    "Technical finding distribution, assessed priority, exposure, and remediation coverage.",
  IT_ADMIN:
    "Operational asset exposure, remediation workload, and unresolved critical work.",
  SECURITY_MANAGER:
    "Combined organizational, technical, exposure, and remediation reporting across the environment.",
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

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function ReportSection({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="border-t border-slate-200 pt-7">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DistributionRow({
  barClassName,
  count,
  label,
  total,
}: {
  barClassName: string;
  count: number;
  label: string;
  total: number;
}) {
  const percentage = total === 0 ? null : Math.round((count / total) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-slate-500">
          {count} {percentage === null ? "" : `(${percentage}%)`}
        </span>
      </div>
      <div
        aria-label={`${label}: ${count}`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage ?? 0}
        className="h-2 overflow-hidden rounded-sm bg-slate-200"
        role="progressbar"
      >
        <div
          className={`h-full rounded-sm ${barClassName}`}
          style={{ width: `${percentage ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function RiskByDepartment({
  canViewRisks,
  summary,
}: {
  canViewRisks: boolean;
  summary: ReportSummary;
}) {
  return (
    <ReportSection
      title="Organizational Risk by Department"
      description="Current unresolved stored assessments on non-archived assets, summarized by business department."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-3 font-semibold">Department</th>
              <th className="px-3 py-3 font-semibold">Current Risks</th>
              <th className="px-3 py-3 font-semibold">High / Critical</th>
              <th className="px-3 py-3 font-semibold">Average Score</th>
              <th className="px-3 py-3 font-semibold">Peak Score</th>
            </tr>
          </thead>
          <tbody>
            {summary.riskByDepartment.map((department) => (
              <tr className="border-b border-slate-100" key={department.departmentId}>
                <td className="px-3 py-3 font-medium text-slate-900">
                  {canViewRisks ? (
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/risks?departmentId=${department.departmentId}`}
                    >
                      {department.departmentName}
                    </Link>
                  ) : (
                    department.departmentName
                  )}
                </td>
                <td className="px-3 py-3 text-slate-600">{department.riskCount}</td>
                <td className="px-3 py-3 text-slate-600">
                  {department.criticalHighRiskCount}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {department.averageScore.toFixed(2)}
                </td>
                <td className="px-3 py-3 font-semibold text-slate-900">
                  {department.highestScore.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {summary.riskByDepartment.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">
            No current organizational risks are available by department.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

function VulnerabilitiesBySeverity({ summary }: { summary: ReportSummary }) {
  const total = summary.metrics.openVulnerabilities;
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-700",
    HIGH: "bg-orange-600",
    MEDIUM: "bg-amber-500",
    LOW: "bg-sky-600",
  };

  return (
    <ReportSection
      title="Vulnerabilities by Severity"
      description="Technical severity of findings that remain open or in review."
    >
      <div className="space-y-4">
        {summary.vulnerabilitiesBySeverity.map((item) => (
          <DistributionRow
            barClassName={colors[item.severity]}
            count={item.count}
            key={item.severity}
            label={formatEnum(item.severity)}
            total={total}
          />
        ))}
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No active vulnerability findings are currently recorded.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

function RiskLevelDistribution({ summary }: { summary: ReportSummary }) {
  const total = summary.riskLevelDistribution.reduce(
    (count, item) => count + item.count,
    0
  );
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-700",
    HIGH: "bg-orange-600",
    MEDIUM: "bg-amber-500",
    LOW: "bg-sky-600",
  };

  return (
    <ReportSection
      title="Organizational Risk Levels"
      description="Distribution of current unresolved stored risk assessments."
    >
      <div className="space-y-4">
        {summary.riskLevelDistribution.map((item) => (
          <DistributionRow
            barClassName={colors[item.level]}
            count={item.count}
            key={item.level}
            label={formatEnum(item.level)}
            total={total}
          />
        ))}
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No current organizational risk assessments are recorded.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

function HighestRiskAssets({
  canViewAssets,
  canViewRisks,
  summary,
}: {
  canViewAssets: boolean;
  canViewRisks: boolean;
  summary: ReportSummary;
}) {
  return (
    <ReportSection
      title="Highest-Risk Assets"
      description="Ranked by highest current stored risk score, then elevated-risk count and asset name."
    >
      <ol className="divide-y divide-slate-100">
        {summary.highestRiskAssets.slice(0, 7).map((asset, index) => {
          const href = canViewAssets
            ? `/assets/${asset.assetId}`
            : canViewRisks
              ? `/risks/${asset.highestRiskRecordId}`
              : null;

          return (
            <li className="flex items-start gap-3 py-3" key={asset.assetId}>
              <span className="w-7 shrink-0 font-semibold text-slate-400">
                #{index + 1}
              </span>
              <div className="min-w-0 flex-1">
                {href ? (
                  <Link
                    className="font-medium text-slate-950 underline-offset-4 hover:underline"
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
              <span className="shrink-0 font-semibold text-slate-900">
                {asset.highestRiskScore.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ol>
      {summary.highestRiskAssets.length === 0 ? (
        <p className="text-sm text-slate-500">
          No current assessed risks are associated with non-archived assets.
        </p>
      ) : null}
    </ReportSection>
  );
}

function HighestRiskVulnerabilities({
  canViewRisks,
  canViewVulnerabilities,
  summary,
}: {
  canViewRisks: boolean;
  canViewVulnerabilities: boolean;
  summary: ReportSummary;
}) {
  return (
    <ReportSection
      title="Highest-Risk Vulnerabilities"
      description="Active findings ranked by stored organizational risk when available, then technical severity."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-3 font-semibold">Priority</th>
              <th className="px-3 py-3 font-semibold">Finding</th>
              <th className="px-3 py-3 font-semibold">CVSS / Severity</th>
              <th className="px-3 py-3 font-semibold">Organizational Risk</th>
            </tr>
          </thead>
          <tbody>
            {summary.highestRiskVulnerabilities.slice(0, 8).map((item, index) => {
              const href = canViewVulnerabilities
                ? `/vulnerabilities/${item.vulnerabilityId}`
                : canViewRisks && item.riskRecordId
                  ? `/risks/${item.riskRecordId}`
                  : null;

              return (
                <tr className="border-b border-slate-100" key={item.vulnerabilityId}>
                  <td className="px-3 py-3 font-semibold text-slate-400">
                    #{index + 1}
                  </td>
                  <td className="px-3 py-3 text-slate-900">
                    {href ? (
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={href}
                      >
                        {item.identifier}: {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {item.identifier}: {item.title}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{item.cvssScore.toFixed(1)}</span>
                      <StatusBadge value={item.severity} />
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.riskScore === null || item.riskLevel === null
                      ? "Not assessed"
                      : (
                          <span className="flex flex-wrap items-center gap-2">
                            <span>{item.riskScore.toFixed(2)}</span>
                            <StatusBadge value={item.riskLevel} />
                          </span>
                        )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {summary.highestRiskVulnerabilities.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">
            No active vulnerabilities are currently recorded.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

function ExposureSummary({ summary }: { summary: ReportSummary }) {
  const exposure = summary.exposureSummary;

  return (
    <ReportSection
      title="Exposure Breakdown"
      description="Internet-facing versus internal assets, excluding archived records."
    >
      <div className="space-y-4">
        <DistributionRow
          barClassName="bg-orange-600"
          count={exposure.internetFacing}
          label="Internet-Facing"
          total={exposure.total}
        />
        <DistributionRow
          barClassName="bg-slate-600"
          count={exposure.internal}
          label="Internal / Not Internet-Facing"
          total={exposure.total}
        />
        <p className="text-xs text-slate-500">
          {exposure.total === 0
            ? "No non-archived asset exposure data is available."
            : `${exposure.internetFacingPercentage}% of non-archived assets are internet-facing.`}
        </p>
      </div>
    </ReportSection>
  );
}

function RemediationProgress({ summary }: { summary: ReportSummary }) {
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
    <ReportSection
      title="Remediation Progress"
      description="Current task distribution across active work, validation, resolution, and accepted risk."
    >
      <div className="space-y-4">
        {summary.remediationProgress.map((item) => (
          <DistributionRow
            barClassName={colors[item.key]}
            count={item.count}
            key={item.key}
            label={item.label}
            total={total}
          />
        ))}
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No remediation tasks are currently recorded.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

function RemediationWorkload({ summary }: { summary: ReportSummary }) {
  return (
    <ReportSection
      title="Remediation Workload"
      description="Active task load by assigned employee, excluding resolved and accepted-risk work."
    >
      <div className="overflow-x-auto">
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
    </ReportSection>
  );
}

function CriticalUnresolvedWork({
  canViewRemediation,
  canViewRisks,
  summary,
}: {
  canViewRemediation: boolean;
  canViewRisks: boolean;
  summary: ReportSummary;
}) {
  return (
    <ReportSection
      title="Critical Unresolved Work"
      description="Active remediation tied to critical technical findings or critical stored organizational risk."
    >
      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-3 font-semibold">Finding / Task</th>
              <th className="px-3 py-3 font-semibold">Asset</th>
              <th className="px-3 py-3 font-semibold">Risk Context</th>
              <th className="px-3 py-3 font-semibold">Assigned To</th>
              <th className="px-3 py-3 font-semibold">Due Date</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Due State</th>
            </tr>
          </thead>
          <tbody>
            {summary.criticalUnresolvedWork.slice(0, 8).map((item) => {
              const href = canViewRemediation
                ? `/remediation/${item.id}`
                : canViewRisks && item.riskRecord
                  ? `/risks/${item.riskRecord.id}`
                  : null;

              return (
                <tr className="border-b border-slate-100" key={item.id}>
                  <td className="px-3 py-3 text-slate-900">
                    {href ? (
                      <Link
                        className="font-medium underline-offset-4 hover:underline"
                        href={href}
                      >
                        {item.relatedVulnerability.identifier}: {item.relatedVulnerability.title}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {item.relatedVulnerability.identifier}: {item.relatedVulnerability.title}
                      </span>
                    )}
                    <span className="mt-1 block text-xs text-slate-500">
                      {item.title}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.relatedAsset.name}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>
                        {item.riskRecord
                          ? item.riskRecord.organizationalRiskScore.toFixed(2)
                          : `CVSS ${item.cvssScore.toFixed(1)}`}
                      </span>
                      <StatusBadge
                        value={
                          item.riskRecord?.organizationalRiskLevel ??
                          item.relatedVulnerability.severity
                        }
                      />
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {item.assignedUserName}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatDate(item.dueDate)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <StatusBadge value={item.status} />
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    <OverdueIndicator isOverdue={item.isOverdue} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {summary.criticalUnresolvedWork.length === 0 ? (
          <p className="py-5 text-sm text-slate-500">
            No critical findings currently have unresolved remediation work.
          </p>
        ) : null}
      </div>
    </ReportSection>
  );
}

export default function ReportsWorkspace({
  generatedAt,
  role,
  summary,
}: ReportsWorkspaceProps) {
  const view = getReportRoleView(role);
  const canViewAssets = hasPermission(role, Permission.VIEW_ASSETS);
  const canViewRemediation = hasPermission(role, Permission.VIEW_REMEDIATION);
  const canViewRisks = hasPermission(role, Permission.VIEW_RISKS);
  const canViewVulnerabilities = hasPermission(
    role,
    Permission.VIEW_VULNERABILITIES
  );

  function renderSection(section: ReportSectionKey) {
    if (section === "riskByDepartment") {
      return <RiskByDepartment canViewRisks={canViewRisks} summary={summary} />;
    }

    if (section === "vulnerabilitiesBySeverity") {
      return <VulnerabilitiesBySeverity summary={summary} />;
    }

    if (section === "riskLevelDistribution") {
      return <RiskLevelDistribution summary={summary} />;
    }

    if (section === "highestRiskAssets") {
      return (
        <HighestRiskAssets
          canViewAssets={canViewAssets}
          canViewRisks={canViewRisks}
          summary={summary}
        />
      );
    }

    if (section === "highestRiskVulnerabilities") {
      return (
        <HighestRiskVulnerabilities
          canViewRisks={canViewRisks}
          canViewVulnerabilities={canViewVulnerabilities}
          summary={summary}
        />
      );
    }

    if (section === "exposureSummary") {
      return <ExposureSummary summary={summary} />;
    }

    if (section === "remediationProgress") {
      return <RemediationProgress summary={summary} />;
    }

    if (section === "remediationWorkload") {
      return <RemediationWorkload summary={summary} />;
    }

    return (
      <CriticalUnresolvedWork
        canViewRemediation={canViewRemediation}
        canViewRisks={canViewRisks}
        summary={summary}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase text-slate-500">
          Current snapshot
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Security and Business Risk Report
        </h3>
        <p className="mt-2 max-w-3xl leading-6 text-slate-600">
          {roleNarratives[role]}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Prepared {formatTimestamp(generatedAt)}. This report reflects current
          records and does not represent a historical trend.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {view.metrics.map((metricKey) => {
          const definition = metricDefinitions[metricKey];
          const canNavigate = hasPermission(role, definition.permission);
          const content = (
            <>
              <p className="text-sm font-medium text-slate-600">
                {definition.label}
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {summary.metrics[metricKey]}
              </p>
              <p className="mt-2 text-xs text-slate-500">{definition.note}</p>
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
        {view.sections.map((section) => {
          const isWide =
            section === "riskByDepartment" ||
            section === "remediationWorkload" ||
            section === "criticalUnresolvedWork" ||
            section === "highestRiskVulnerabilities";

          return (
            <div className={isWide ? "xl:col-span-2" : ""} key={section}>
              {renderSection(section)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
