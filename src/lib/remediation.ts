import {
  OrganizationalRiskLevel,
  RemediationPriority,
  RemediationStatus,
  VulnerabilitySeverity,
  type OrganizationalRiskLevel as OrganizationalRiskLevelValue,
  type RemediationPriority as RemediationPriorityValue,
  type RemediationStatus as RemediationStatusValue,
  type VulnerabilitySeverity as VulnerabilitySeverityValue,
} from "../generated/prisma/client";

type RemediationDeadline = {
  dueDate: Date;
  status: RemediationStatusValue;
};

type WorkflowTask = RemediationDeadline & {
  id: string;
  priority: RemediationPriorityValue;
  title: string;
};

type RemediationTimestamps = {
  createdAt: Date;
  status: RemediationStatusValue;
  updatedAt: Date;
};

type WorkloadTask = RemediationDeadline & {
  assignedUser: {
    department: { name: string } | null;
    id: string;
    name: string;
  };
  priority: RemediationPriorityValue;
};

type CriticalVulnerabilityTask = {
  status: RemediationStatusValue;
  relatedVulnerability: {
    id: string;
    severity: VulnerabilitySeverityValue;
    riskRecord: {
      organizationalRiskLevel: OrganizationalRiskLevelValue;
    } | null;
  };
};

type RankedCriticalTask = CriticalVulnerabilityTask & {
  dueDate: Date;
  id: string;
  priority: RemediationPriorityValue;
  title: string;
  relatedVulnerability: CriticalVulnerabilityTask["relatedVulnerability"] & {
    cvssScore: number;
    riskRecord: {
      organizationalRiskLevel: OrganizationalRiskLevelValue;
      organizationalRiskScore: number;
    } | null;
  };
};

export type RemediationWorkload = {
  criticalPriorityCount: number;
  departmentName: string | null;
  highPriorityCount: number;
  overdueCount: number;
  totalUnresolvedTasks: number;
  userId: string;
  userName: string;
};

type RemediationSummaryTask = RemediationDeadline &
  RemediationTimestamps &
  CriticalVulnerabilityTask;

const completedStatuses = new Set<RemediationStatusValue>([
  RemediationStatus.RESOLVED,
  RemediationStatus.ACCEPTED_RISK,
]);

const priorityRank: Record<RemediationPriorityValue, number> = {
  [RemediationPriority.LOW]: 1,
  [RemediationPriority.MEDIUM]: 2,
  [RemediationPriority.HIGH]: 3,
  [RemediationPriority.CRITICAL]: 4,
};

export function isRemediationTaskOverdue(
  task: RemediationDeadline,
  currentTime = new Date()
) {
  return task.dueDate.getTime() < currentTime.getTime() &&
    !completedStatuses.has(task.status);
}

export function isRemediationTaskActive(task: {
  status: RemediationStatusValue;
}) {
  return !completedStatuses.has(task.status);
}

export function calculateApproximateAverageRemediationTimeMs(
  tasks: readonly RemediationTimestamps[]
) {
  const resolvedTasks = tasks.filter(
    (task) => task.status === RemediationStatus.RESOLVED
  );

  if (resolvedTasks.length === 0) {
    return null;
  }

  // The v1 schema has no resolvedAt field, so updatedAt is the best available endpoint.
  const totalDuration = resolvedTasks.reduce(
    (total, task) => total + (task.updatedAt.getTime() - task.createdAt.getTime()),
    0
  );

  return totalDuration / resolvedTasks.length;
}

function isCriticalUnresolvedTask(task: CriticalVulnerabilityTask) {
  return isRemediationTaskActive(task) &&
    (task.relatedVulnerability.severity === VulnerabilitySeverity.CRITICAL ||
      task.relatedVulnerability.riskRecord?.organizationalRiskLevel ===
        OrganizationalRiskLevel.CRITICAL);
}

export function countUniqueCriticalUnresolvedVulnerabilities(
  tasks: readonly CriticalVulnerabilityTask[]
) {
  return new Set(
    tasks
      .filter(isCriticalUnresolvedTask)
      .map((task) => task.relatedVulnerability.id)
  ).size;
}

export function summarizeRemediationOperations(
  tasks: readonly RemediationSummaryTask[],
  currentTime = new Date()
) {
  return {
    approximateAverageRemediationTimeMs:
      calculateApproximateAverageRemediationTimeMs(tasks),
    criticalUnresolvedVulnerabilityCount:
      countUniqueCriticalUnresolvedVulnerabilities(tasks),
    openRemediationCount: tasks.filter(isRemediationTaskActive).length,
    overdueTaskCount: tasks.filter((task) =>
      isRemediationTaskOverdue(task, currentTime)
    ).length,
  };
}

export function rankCriticalUnresolvedTasks<T extends RankedCriticalTask>(
  tasks: readonly T[]
) {
  return tasks.filter(isCriticalUnresolvedTask).sort((first, second) => {
    const riskScoreDifference =
      (second.relatedVulnerability.riskRecord?.organizationalRiskScore ?? -1) -
      (first.relatedVulnerability.riskRecord?.organizationalRiskScore ?? -1);

    if (riskScoreDifference !== 0) {
      return riskScoreDifference;
    }

    const cvssDifference =
      second.relatedVulnerability.cvssScore -
      first.relatedVulnerability.cvssScore;

    if (cvssDifference !== 0) {
      return cvssDifference;
    }

    const priorityDifference =
      priorityRank[second.priority] - priorityRank[first.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const dueDateDifference = first.dueDate.getTime() - second.dueDate.getTime();

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    const titleDifference = first.title.localeCompare(second.title);

    return titleDifference !== 0
      ? titleDifference
      : first.id.localeCompare(second.id);
  });
}

export function aggregateRemediationWorkload(
  tasks: readonly WorkloadTask[],
  currentTime = new Date()
) {
  const workloadByUser = new Map<string, RemediationWorkload>();

  for (const task of tasks) {
    if (!isRemediationTaskActive(task)) {
      continue;
    }

    const existing = workloadByUser.get(task.assignedUser.id) ?? {
      criticalPriorityCount: 0,
      departmentName: task.assignedUser.department?.name ?? null,
      highPriorityCount: 0,
      overdueCount: 0,
      totalUnresolvedTasks: 0,
      userId: task.assignedUser.id,
      userName: task.assignedUser.name,
    };

    existing.totalUnresolvedTasks += 1;

    if (task.priority === RemediationPriority.CRITICAL) {
      existing.criticalPriorityCount += 1;
    }

    if (task.priority === RemediationPriority.HIGH) {
      existing.highPriorityCount += 1;
    }

    if (isRemediationTaskOverdue(task, currentTime)) {
      existing.overdueCount += 1;
    }

    workloadByUser.set(task.assignedUser.id, existing);
  }

  return [...workloadByUser.values()].sort((first, second) => {
    const taskCountDifference =
      second.totalUnresolvedTasks - first.totalUnresolvedTasks;

    if (taskCountDifference !== 0) {
      return taskCountDifference;
    }

    const overdueDifference = second.overdueCount - first.overdueCount;

    return overdueDifference !== 0
      ? overdueDifference
      : first.userName.localeCompare(second.userName);
  });
}

export function sortRemediationTasksForWorkflow<T extends WorkflowTask>(
  tasks: readonly T[],
  currentTime = new Date()
) {
  return [...tasks].sort((first, second) => {
    const firstIsOverdue = isRemediationTaskOverdue(first, currentTime);
    const secondIsOverdue = isRemediationTaskOverdue(second, currentTime);

    if (firstIsOverdue !== secondIsOverdue) {
      return firstIsOverdue ? -1 : 1;
    }

    const dueDateDifference = first.dueDate.getTime() - second.dueDate.getTime();

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    const priorityDifference =
      priorityRank[second.priority] - priorityRank[first.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const titleDifference = first.title.localeCompare(second.title);

    return titleDifference !== 0
      ? titleDifference
      : first.id.localeCompare(second.id);
  });
}
