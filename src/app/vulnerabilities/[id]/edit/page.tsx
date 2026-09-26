import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import VulnerabilityForm from "@/components/vulnerabilities/vulnerability-form";
import {
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { formatDateInputValue } from "@/lib/date-format";
import { Permission } from "@/lib/permissions";
import { isUuid } from "@/lib/identifiers";

export const dynamic = "force-dynamic";

type EditVulnerabilityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVulnerabilityPage({
  params,
}: EditVulnerabilityPageProps) {
  await requirePermission(Permission.MANAGE_VULNERABILITIES);
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const [vulnerability, assets] = await Promise.all([
    prisma.vulnerability.findUnique({ where: { id } }),
    prisma.asset.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!vulnerability) {
    notFound();
  }

  return (
    <PageSection
      title={`Edit ${vulnerability.identifier}`}
      subtitle="Update this vulnerability finding and its affected asset association."
    >
      <VulnerabilityForm
        assets={assets}
        cancelHref={`/vulnerabilities/${vulnerability.id}`}
        severityOptions={Object.values(VulnerabilitySeverity)}
        statusOptions={Object.values(VulnerabilityStatus)}
        submitLabel="Save Vulnerability"
        vulnerability={{
          id: vulnerability.id,
          identifier: vulnerability.identifier,
          title: vulnerability.title,
          description: vulnerability.description ?? "",
          cvssScore: vulnerability.cvssScore.toString(),
          severity: vulnerability.severity,
          affectedAssetId: vulnerability.affectedAssetId,
          detectionDate: formatDateInputValue(vulnerability.detectionDate),
          status: vulnerability.status,
        }}
      />
    </PageSection>
  );
}
