"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  RemediationPriority,
  RemediationStatus,
  type RemediationPriority as RemediationPriorityValue,
  type RemediationStatus as RemediationStatusValue,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";

export type RemediationTaskFormState = {
  error: string;
};

type RemediationTaskInput = {
  title: string;
  description: string | null;
  assignedUserId: string;
  relatedVulnerabilityId: string;
  priority: RemediationPriorityValue;
  dueDate: Date;
  status: RemediationStatusValue;
  resolutionNotes: string | null;
};

class FormValidationError extends Error {}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getText(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalText(formData: FormData, field: string) {
  const value = getText(formData, field);

  return value.length > 0 ? value : null;
}

function isPriority(value: string): value is RemediationPriorityValue {
  return Object.values(RemediationPriority).includes(
    value as RemediationPriorityValue
  );
}

function isStatus(value: string): value is RemediationStatusValue {
  return Object.values(RemediationStatus).includes(
    value as RemediationStatusValue
  );
}

function parseDueDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

function readRemediationTaskInput(
  formData: FormData
): RemediationTaskInput | RemediationTaskFormState {
  const title = getText(formData, "title");
  const description = getOptionalText(formData, "description");
  const assignedUserId = getText(formData, "assignedUserId");
  const relatedVulnerabilityId = getText(
    formData,
    "relatedVulnerabilityId"
  );
  const priority = getText(formData, "priority");
  const dueDate = parseDueDate(getText(formData, "dueDate"));
  const status = getText(formData, "status");
  const resolutionNotes = getOptionalText(formData, "resolutionNotes");

  if (!title || !relatedVulnerabilityId || !assignedUserId) {
    return {
      error: "Title, related vulnerability, and assigned user are required.",
    };
  }

  if (title.length > 160) {
    return { error: "Task title must be 160 characters or fewer." };
  }

  if (description && description.length > 4000) {
    return { error: "Description must be 4,000 characters or fewer." };
  }

  if (resolutionNotes && resolutionNotes.length > 4000) {
    return { error: "Resolution notes must be 4,000 characters or fewer." };
  }

  if (!UUID_PATTERN.test(relatedVulnerabilityId)) {
    return { error: "Selected related vulnerability is not valid." };
  }

  if (!UUID_PATTERN.test(assignedUserId)) {
    return { error: "Selected assigned user is not valid." };
  }

  if (!isPriority(priority)) {
    return { error: "Priority is not valid." };
  }

  if (!dueDate) {
    return { error: "Due date must be a valid calendar date." };
  }

  if (!isStatus(status)) {
    return { error: "Status is not valid." };
  }

  return {
    title,
    description,
    assignedUserId,
    relatedVulnerabilityId,
    priority,
    dueDate,
    status,
    resolutionNotes,
  };
}

async function saveRemediationTask(
  input: RemediationTaskInput,
  remediationTaskId?: string
) {
  return prisma.$transaction(async (transaction) => {
    const [vulnerability, assignedUser, existingTask] = await Promise.all([
      transaction.vulnerability.findUnique({
        where: { id: input.relatedVulnerabilityId },
        select: {
          id: true,
          affectedAsset: { select: { id: true } },
        },
      }),
      transaction.user.findUnique({
        where: { id: input.assignedUserId },
        select: { id: true },
      }),
      remediationTaskId
        ? transaction.remediationTask.findUnique({
            where: { id: remediationTaskId },
            select: { id: true },
          })
        : null,
    ]);

    if (!vulnerability) {
      throw new FormValidationError(
        "Selected related vulnerability no longer exists."
      );
    }

    if (!vulnerability.affectedAsset) {
      throw new FormValidationError(
        "The selected vulnerability does not have a valid affected asset."
      );
    }

    if (!assignedUser) {
      throw new FormValidationError("Selected assigned user no longer exists.");
    }

    if (remediationTaskId && !existingTask) {
      throw new FormValidationError("This remediation task no longer exists.");
    }

    const data = {
      ...input,
      relatedAssetId: vulnerability.affectedAsset.id,
    };

    if (remediationTaskId) {
      const task = await transaction.remediationTask.update({
        where: { id: remediationTaskId },
        data,
        select: { id: true },
      });

      return task.id;
    }

    const task = await transaction.remediationTask.create({
      data,
      select: { id: true },
    });

    return task.id;
  });
}

export async function createRemediationTask(
  _previousState: RemediationTaskFormState,
  formData: FormData
): Promise<RemediationTaskFormState> {
  await requirePermission(Permission.MANAGE_REMEDIATION);
  const input = readRemediationTaskInput(formData);

  if ("error" in input) {
    return input;
  }

  let remediationTaskId: string;

  try {
    remediationTaskId = await saveRemediationTask(input);
  } catch (error) {
    if (error instanceof FormValidationError) {
      return { error: error.message };
    }

    return {
      error: "The remediation task could not be created. Please try again.",
    };
  }

  revalidatePath("/remediation");
  revalidatePath("/");
  redirect(`/remediation/${remediationTaskId}`);
}

export async function updateRemediationTask(
  remediationTaskId: string,
  _previousState: RemediationTaskFormState,
  formData: FormData
): Promise<RemediationTaskFormState> {
  await requirePermission(Permission.MANAGE_REMEDIATION);
  if (!UUID_PATTERN.test(remediationTaskId)) {
    return { error: "This remediation task is not valid." };
  }

  const input = readRemediationTaskInput(formData);

  if ("error" in input) {
    return input;
  }

  try {
    await saveRemediationTask(input, remediationTaskId);
  } catch (error) {
    if (error instanceof FormValidationError) {
      return { error: error.message };
    }

    return {
      error: "The remediation task could not be updated. Please try again.",
    };
  }

  revalidatePath("/remediation");
  revalidatePath(`/remediation/${remediationTaskId}`);
  revalidatePath("/");
  redirect(`/remediation/${remediationTaskId}`);
}
