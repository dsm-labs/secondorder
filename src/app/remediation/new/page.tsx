import PageSection from "@/components/page-section";
import RemediationTaskForm from "@/components/remediation/remediation-task-form";
import {
  RemediationPriority,
  RemediationStatus,
} from "@/generated/prisma/client";
import { getRemediationFormOptions } from "@/lib/remediation-form-options";

export const dynamic = "force-dynamic";

export default async function NewRemediationTaskPage() {
  const { users, vulnerabilities } = await getRemediationFormOptions();

  return (
    <PageSection
      title="Add Remediation Task"
      subtitle="Assign remediation work for a vulnerability and its affected asset."
    >
      <RemediationTaskForm
        cancelHref="/remediation"
        priorityOptions={Object.values(RemediationPriority)}
        statusOptions={Object.values(RemediationStatus)}
        submitLabel="Create Remediation Task"
        users={users}
        vulnerabilities={vulnerabilities}
      />
    </PageSection>
  );
}
