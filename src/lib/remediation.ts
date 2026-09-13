import {
  RemediationPriority,
  RemediationStatus,
  type RemediationPriority as RemediationPriorityValue,
  type RemediationStatus as RemediationStatusValue,
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

    return titleDifference !== 0 ? titleDifference : first.id.localeCompare(second.id);
  });
}
