import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import VulnerabilityForm from "@/components/vulnerabilities/vulnerability-form";
import {
  VulnerabilitySeverity,
  VulnerabilityStatus,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type EditVulnerabilityPageProps = {
  params: Promise<{ id: string }>;
};

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function EditVulnerabilityPage({
  params,
}: EditVulnerabilityPageProps) {
  await requireUser();
  const { id } = await params;
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
          detectionDate: formatDateInput(vulnerability.detectionDate),
          status: vulnerability.status,
        }}
      />
    </PageSection>
  );
}
