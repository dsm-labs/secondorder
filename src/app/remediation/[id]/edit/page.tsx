import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import RemediationTaskForm from "@/components/remediation/remediation-task-form";
import {
  RemediationPriority,
  RemediationStatus,
} from "@/generated/prisma/client";
import { getRemediationFormOptions } from "@/lib/remediation-form-options";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { formatDateInputValue } from "@/lib/date-format";
import { Permission } from "@/lib/permissions";
import { isUuid } from "@/lib/identifiers";

export const dynamic = "force-dynamic";

type EditRemediationTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRemediationTaskPage({
  params,
}: EditRemediationTaskPageProps) {
  await requirePermission(Permission.MANAGE_REMEDIATION);
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const [task, options] = await Promise.all([
    prisma.remediationTask.findUnique({ where: { id } }),
    getRemediationFormOptions(),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${task.title}`}
      subtitle="Update assignment, due date, status, and resolution details."
    >
      <RemediationTaskForm
        cancelHref={`/remediation/${task.id}`}
        priorityOptions={Object.values(RemediationPriority)}
        statusOptions={Object.values(RemediationStatus)}
        submitLabel="Save Remediation Task"
        task={{
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          assignedUserId: task.assignedUserId,
          relatedVulnerabilityId: task.relatedVulnerabilityId,
          priority: task.priority,
          dueDate: formatDateInputValue(task.dueDate),
          status: task.status,
          resolutionNotes: task.resolutionNotes ?? "",
        }}
        users={options.users}
        vulnerabilities={options.vulnerabilities}
      />
    </PageSection>
  );
}
