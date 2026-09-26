import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import OverdueIndicator from "@/components/remediation/overdue-indicator";
import StatusBadge from "@/components/ui/status-badge";
import { isRemediationTaskOverdue } from "@/lib/remediation";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { hasPermission, Permission } from "@/lib/permissions";
import { isUuid } from "@/lib/identifiers";

export const dynamic = "force-dynamic";

type RemediationTaskDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(value);
}

export default async function RemediationTaskDetailPage({
  params,
}: RemediationTaskDetailPageProps) {
  const user = await requirePermission(Permission.VIEW_REMEDIATION);
  const canManageRemediation = hasPermission(
    user.role,
    Permission.MANAGE_REMEDIATION
  );
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const task = await prisma.remediationTask.findUnique({
    where: { id },
    include: {
      assignedUser: {
        include: { department: true },
      },
      relatedVulnerability: {
        include: { riskRecord: true },
      },
      relatedAsset: {
        include: { department: true },
      },
    },
  });

  if (!task) {
    notFound();
  }

  const isOverdue = isRemediationTaskOverdue(task);
  const taskDetails = [
    {
      label: "Assigned User",
      value: `${task.assignedUser.name} (${task.assignedUser.department.name})`,
    },
    { label: "Priority", value: <StatusBadge value={task.priority} /> },
    { label: "Due Date", value: formatDate(task.dueDate) },
    { label: "Status", value: <StatusBadge value={task.status} /> },
    { label: "Created", value: formatTimestamp(task.createdAt) },
    { label: "Last Updated", value: formatTimestamp(task.updatedAt) },
  ];
  const vulnerabilityDetails = [
    {
      label: "Vulnerability",
      value: `${task.relatedVulnerability.identifier}: ${task.relatedVulnerability.title}`,
    },
    {
      label: "CVSS / Severity",
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <span>{task.relatedVulnerability.cvssScore.toString()}</span>
          <StatusBadge value={task.relatedVulnerability.severity} />
        </span>
      ),
    },
    {
      label: "Vulnerability Status",
      value: <StatusBadge value={task.relatedVulnerability.status} />,
    },
  ];
  const assetDetails = [
    { label: "Related Asset", value: task.relatedAsset.name },
    { label: "Department", value: task.relatedAsset.department.name },
    {
      label: "Business Criticality",
      value: <StatusBadge value={task.relatedAsset.businessCriticality} />,
    },
    {
      label: "Internet Exposure",
      value: (
        <StatusBadge
          label={task.relatedAsset.internetExposure ? "Internet-Facing" : "Internal"}
          tone={task.relatedAsset.internetExposure ? "warning" : "neutral"}
          value={task.relatedAsset.internetExposure ? "EXPOSED" : "INTERNAL"}
        />
      ),
    },
  ];
  const riskDetails = task.relatedVulnerability.riskRecord
    ? [
        {
          label: "Organizational Risk Score",
          value: Number(
            task.relatedVulnerability.riskRecord.organizationalRiskScore.toString()
          ).toFixed(2),
        },
        {
          label: "Organizational Risk Level",
          value: (
            <StatusBadge
              value={
                task.relatedVulnerability.riskRecord.organizationalRiskLevel
              }
            />
          ),
        },
      ]
    : [];

  return (
    <PageSection
      title={task.title}
      subtitle="Assignment, due date, and security context for this remediation task."
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href="/remediation"
          >
            Back to Remediation
          </Link>
          {canManageRemediation ? (
            <Link
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/remediation/${task.id}/edit`}
            >
              Edit Task
            </Link>
          ) : null}
        </div>
        <OverdueIndicator isOverdue={isOverdue} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {taskDetails.map((detail) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={detail.label}
          >
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {detail.label}
            </dt>
            <dd className="mt-2 font-medium text-slate-950">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">Description</h3>
        <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {task.description ?? "No description provided."}
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Vulnerability Context
        </h3>
        <dl className="mt-4 grid gap-4 xl:grid-cols-3">
          {vulnerabilityDetails.map((detail) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
              key={detail.label}
            >
              <dt className="text-xs font-semibold uppercase text-slate-500">
                {detail.label}
              </dt>
              <dd className="mt-2 font-medium text-slate-950">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          className="mt-4 inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
          href={`/vulnerabilities/${task.relatedVulnerability.id}`}
        >
          View Vulnerability
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Asset Context
        </h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {assetDetails.map((detail) => (
            <div
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
              key={detail.label}
            >
              <dt className="text-xs font-semibold uppercase text-slate-500">
                {detail.label}
              </dt>
              <dd className="mt-2 font-medium text-slate-950">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          className="mt-4 inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
          href={`/assets/${task.relatedAsset.id}`}
        >
          View Asset
        </Link>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Organizational Risk
        </h3>
        {riskDetails.length > 0 ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {riskDetails.map((detail) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
                key={detail.label}
              >
                <dt className="text-xs font-semibold uppercase text-slate-500">
                  {detail.label}
                </dt>
                <dd className="mt-2 font-medium text-slate-950">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No organizational risk assessment is linked to this vulnerability.
          </p>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Resolution Notes
        </h3>
        <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {task.resolutionNotes ?? "No resolution notes provided."}
        </p>
      </div>
    </PageSection>
  );
}
