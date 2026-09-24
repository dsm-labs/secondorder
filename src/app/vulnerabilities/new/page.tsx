import PageSection from "@/components/page-section";
import VulnerabilityForm from "@/components/vulnerabilities/vulnerability-form";
import {
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NewVulnerabilityPage() {
  await requirePermission(Permission.MANAGE_VULNERABILITIES);
  const assets = await prisma.asset.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <PageSection
      title="Add Vulnerability"
      subtitle="Create a vulnerability finding and associate it with an affected asset."
    >
      <VulnerabilityForm
        assets={assets}
        cancelHref="/vulnerabilities"
        severityOptions={Object.values(VulnerabilitySeverity)}
        statusOptions={Object.values(VulnerabilityStatus)}
        submitLabel="Create Vulnerability"
      />
    </PageSection>
  );
}
