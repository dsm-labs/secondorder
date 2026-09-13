import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import RemediationTaskForm from "@/components/remediation/remediation-task-form";
import {
  RemediationPriority,
  RemediationStatus,
} from "@/generated/prisma/client";
import { getRemediationFormOptions } from "@/lib/remediation-form-options";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditRemediationTaskPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function EditRemediationTaskPage({
  params,
}: EditRemediationTaskPageProps) {
  const { id } = await params;
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
          dueDate: formatDateInput(task.dueDate),
          status: task.status,
          resolutionNotes: task.resolutionNotes ?? "",
        }}
        users={options.users}
        vulnerabilities={options.vulnerabilities}
      />
    </PageSection>
  );
}
