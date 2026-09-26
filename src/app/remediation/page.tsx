import Link from "next/link";
import PageSection from "@/components/page-section";
import OverdueIndicator from "@/components/remediation/overdue-indicator";
import RemediationOperationsOverview from "@/components/remediation/remediation-operations-overview";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import {
  Prisma,
  RemediationPriority,
  RemediationStatus,
  type RemediationPriority as RemediationPriorityValue,
  type RemediationStatus as RemediationStatusValue,
} from "@/generated/prisma/client";
import {
  aggregateRemediationWorkload,
  isRemediationTaskOverdue,
  rankCriticalUnresolvedTasks,
  sortRemediationTasksForWorkflow,
  summarizeRemediationOperations,
} from "@/lib/remediation";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { formatDisplayDate } from "@/lib/date-format";
import { hasPermission, Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type RemediationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = [
  { label: "Workflow Priority", value: "workflow" },
  { label: "Due Date Earliest", value: "due_asc" },
  { label: "Due Date Latest", value: "due_desc" },
  { label: "Priority High-Low", value: "priority_desc" },
  { label: "Priority Low-High", value: "priority_asc" },
  { label: "Status A-Z", value: "status_asc" },
  { label: "Status Z-A", value: "status_desc" },
  { label: "Task Title A-Z", value: "title_asc" },
  { label: "Task Title Z-A", value: "title_desc" },
  { label: "Created Date Newest", value: "created_desc" },
  { label: "Created Date Oldest", value: "created_asc" },
  { label: "Last Updated Newest", value: "updated_desc" },
  { label: "Last Updated Oldest", value: "updated_asc" },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isPriority(
  value: string | undefined
): value is RemediationPriorityValue {
  return value
    ? Object.values(RemediationPriority).includes(
        value as RemediationPriorityValue
      )
    : false;
}

function isStatus(value: string | undefined): value is RemediationStatusValue {
  return value
    ? Object.values(RemediationStatus).includes(value as RemediationStatusValue)
    : false;
}

function getRemediationOrderBy(
  sort: string
): Prisma.RemediationTaskOrderByWithRelationInput[] {
  if (sort === "due_desc") {
    return [{ dueDate: "desc" }, { priority: "desc" }, { title: "asc" }];
  }

  if (sort === "priority_desc") {
    return [{ priority: "desc" }, { dueDate: "asc" }, { title: "asc" }];
  }

  if (sort === "priority_asc") {
    return [{ priority: "asc" }, { dueDate: "asc" }, { title: "asc" }];
  }

  if (sort === "status_asc") {
    return [{ status: "asc" }, { dueDate: "asc" }, { title: "asc" }];
  }

  if (sort === "status_desc") {
    return [{ status: "desc" }, { dueDate: "asc" }, { title: "asc" }];
  }

  if (sort === "title_asc") {
    return [{ title: "asc" }, { dueDate: "asc" }];
  }

  if (sort === "title_desc") {
    return [{ title: "desc" }, { dueDate: "asc" }];
  }

  if (sort === "created_desc") {
    return [{ createdAt: "desc" }, { title: "asc" }];
  }

  if (sort === "created_asc") {
    return [{ createdAt: "asc" }, { title: "asc" }];
  }

  if (sort === "updated_desc") {
    return [{ updatedAt: "desc" }, { title: "asc" }];
  }

  if (sort === "updated_asc") {
    return [{ updatedAt: "asc" }, { title: "asc" }];
  }

  return [{ dueDate: "asc" }, { priority: "desc" }, { title: "asc" }];
}

export default async function RemediationPage({
  searchParams,
}: RemediationPageProps) {
  const user = await requirePermission(Permission.VIEW_REMEDIATION);
  const canManageRemediation = hasPermission(
    user.role,
    Permission.MANAGE_REMEDIATION
  );
  const params = await searchParams;
  const query = getSingleParam(params.q)?.trim() ?? "";
  const status = getSingleParam(params.status);
  const priority = getSingleParam(params.priority);
  const rawAssignedUserId = getSingleParam(params.assignedUserId) ?? "";
  const rawRelatedAssetId = getSingleParam(params.relatedAssetId) ?? "";
  const assignedUserId = UUID_PATTERN.test(rawAssignedUserId)
    ? rawAssignedUserId
    : "";
  const relatedAssetId = UUID_PATTERN.test(rawRelatedAssetId)
    ? rawRelatedAssetId
    : "";
  const overdue = getSingleParam(params.overdue) ?? "all";
  const sort = getSingleParam(params.sort) ?? "workflow";
  const hasFilters = Boolean(
    query ||
      status ||
      priority ||
      assignedUserId ||
      relatedAssetId ||
      overdue !== "all"
  );
  const currentTime = new Date();
  const conditions: Prisma.RemediationTaskWhereInput[] = [];

  if (query) {
    conditions.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        {
          relatedVulnerability: {
            identifier: { contains: query, mode: "insensitive" },
          },
        },
        {
          relatedVulnerability: {
            title: { contains: query, mode: "insensitive" },
          },
        },
        {
          relatedAsset: {
            name: { contains: query, mode: "insensitive" },
          },
        },
        {
          assignedUser: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (isStatus(status)) {
    conditions.push({ status });
  }

  if (isPriority(priority)) {
    conditions.push({ priority });
  }

  if (assignedUserId) {
    conditions.push({ assignedUserId });
  }

  if (relatedAssetId) {
    conditions.push({ relatedAssetId });
  }

  if (overdue === "overdue") {
    conditions.push({
      dueDate: { lt: currentTime },
      status: {
        notIn: [RemediationStatus.RESOLVED, RemediationStatus.ACCEPTED_RISK],
      },
    });
  }

  if (overdue === "not_overdue") {
    conditions.push({
      OR: [
        { dueDate: { gte: currentTime } },
        {
          status: {
            in: [RemediationStatus.RESOLVED, RemediationStatus.ACCEPTED_RISK],
          },
        },
      ],
    });
  }

  const where: Prisma.RemediationTaskWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const [queriedTasks, users, assets, operationalTasks] = await Promise.all([
    prisma.remediationTask.findMany({
      where,
      include: {
        assignedUser: true,
        relatedVulnerability: true,
        relatedAsset: true,
      },
      orderBy: getRemediationOrderBy(sort),
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.asset.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.remediationTask.findMany({
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
        relatedAsset: {
          select: { id: true, name: true },
        },
        relatedVulnerability: {
          select: {
            id: true,
            identifier: true,
            title: true,
            cvssScore: true,
            severity: true,
            riskRecord: {
              select: {
                organizationalRiskScore: true,
                organizationalRiskLevel: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const remediationTasks =
    sort === "workflow"
      ? sortRemediationTasksForWorkflow(queriedTasks, currentTime)
      : queriedTasks;
  const operationalTaskData = operationalTasks.map((task) => ({
    ...task,
    relatedVulnerability: {
      ...task.relatedVulnerability,
      cvssScore: Number(task.relatedVulnerability.cvssScore.toString()),
      riskRecord: task.relatedVulnerability.riskRecord
        ? {
            ...task.relatedVulnerability.riskRecord,
            organizationalRiskScore: Number(
              task.relatedVulnerability.riskRecord.organizationalRiskScore.toString()
            ),
          }
        : null,
    },
  }));
  const summary = summarizeRemediationOperations(
    operationalTaskData,
    currentTime
  );
  const workload = aggregateRemediationWorkload(
    operationalTaskData,
    currentTime
  );
  const criticalItems = rankCriticalUnresolvedTasks(operationalTaskData)
    .slice(0, 5)
    .map((task) => ({
      assignedUserName: task.assignedUser.name,
      cvssScore: task.relatedVulnerability.cvssScore,
      dueDate: task.dueDate,
      id: task.id,
      isOverdue: isRemediationTaskOverdue(task, currentTime),
      relatedAsset: task.relatedAsset,
      relatedVulnerability: {
        identifier: task.relatedVulnerability.identifier,
        title: task.relatedVulnerability.title,
      },
      riskRecord: task.relatedVulnerability.riskRecord,
      status: task.status,
    }));

  return (
    <PageSection
      title="Remediation"
      subtitle="Assign, prioritize, and track remediation work through completion."
    >
      <RemediationOperationsOverview
        approximateAverageRemediationTimeMs={
          summary.approximateAverageRemediationTimeMs
        }
        criticalItems={criticalItems}
        criticalUnresolvedVulnerabilityCount={
          summary.criticalUnresolvedVulnerabilityCount
        }
        openRemediationCount={summary.openRemediationCount}
        overdueTaskCount={summary.overdueTaskCount}
        workload={workload}
      />

      <div className="mb-6 mt-8 flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {remediationTasks.length} task
            {remediationTasks.length === 1 ? "" : "s"}.
          </p>
          {canManageRemediation ? (
            <Link
              className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/remediation/new"
            >
              Add Remediation Task
            </Link>
          ) : null}
        </div>

        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" method="get">
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Search
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={query}
              name="q"
              placeholder="Task, vulnerability, asset, or assignee"
              type="search"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isStatus(status) ? status : ""}
              name="status"
            >
              <option value="">All statuses</option>
              {Object.values(RemediationStatus).map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Priority
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isPriority(priority) ? priority : ""}
              name="priority"
            >
              <option value="">All priorities</option>
              {Object.values(RemediationPriority).map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Assigned User
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={assignedUserId}
              name="assignedUserId"
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Related Asset
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={relatedAssetId}
              name="relatedAssetId"
            >
              <option value="">All assets</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Overdue
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={
                overdue === "overdue" || overdue === "not_overdue"
                  ? overdue
                  : "all"
              }
              name="overdue"
            >
              <option value="all">All</option>
              <option value="overdue">Overdue</option>
              <option value="not_overdue">Not Overdue</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Sort
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={
                sortOptions.some((option) => option.value === sort)
                  ? sort
                  : "workflow"
              }
              name="sort"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
            <button
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/remediation"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full border-collapse text-left">
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
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Due State
              </th>
            </tr>
          </thead>
          <tbody>
            {remediationTasks.map((task) => {
              const taskIsOverdue = isRemediationTaskOverdue(task, currentTime);

              return (
                <tr className="border-b border-slate-100" key={task.id}>
                  <td className="px-3 py-4 font-medium text-slate-900">
                    <Link
                      className="text-slate-950 underline-offset-4 hover:underline"
                      href={`/remediation/${task.id}`}
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/vulnerabilities/${task.relatedVulnerability.id}`}
                    >
                      {task.relatedVulnerability.identifier}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <Link
                      className="underline-offset-4 hover:underline"
                      href={`/assets/${task.relatedAsset.id}`}
                    >
                      {task.relatedAsset.name}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {task.assignedUser.name}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <StatusBadge value={task.priority} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatDisplayDate(task.dueDate)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <StatusBadge value={task.status} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <OverdueIndicator isOverdue={taskIsOverdue} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {remediationTasks.length === 0 ? (
          <EmptyState
            action={
              hasFilters ? (
                <Link
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/remediation"
                >
                  Clear Filters
                </Link>
              ) : canManageRemediation ? (
                <Link
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  href="/remediation/new"
                >
                  Add Remediation Task
                </Link>
              ) : undefined
            }
            description={
              hasFilters
                ? "Try broadening your search or clearing one or more filters."
                : "No remediation tasks are currently recorded."
            }
            title={
              hasFilters ? "No matching remediation tasks" : "No remediation tasks yet"
            }
          />
        ) : null}
      </div>
    </PageSection>
  );
}
