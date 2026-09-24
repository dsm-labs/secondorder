import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";
import {
  OrganizationalRiskLevel,
  RemediationStatus,
  VulnerabilityStatus,
} from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requirePermission(Permission.VIEW_DASHBOARD);
  const [
    totalAssets,
    openVulnerabilities,
    criticalRisks,
    openRemediationTasks,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.vulnerability.count({
      where: { status: VulnerabilityStatus.OPEN },
    }),
    prisma.riskRecord.count({
      where: { organizationalRiskLevel: OrganizationalRiskLevel.CRITICAL },
    }),
    prisma.remediationTask.count({
      where: { status: RemediationStatus.OPEN },
    }),
  ]);

  const dashboardMetrics = [
    { label: "Total Assets", value: totalAssets.toString() },
    { label: "Open Vulnerabilities", value: openVulnerabilities.toString() },
    { label: "Critical Risks", value: criticalRisks.toString() },
    { label: "Open Remediation Tasks", value: openRemediationTasks.toString() },
  ];

  return (
    <PageSection
      title="Dashboard"
      subtitle="A simple starting point for the future SecondOrder overview."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={metric.label}
          >
            <p className="text-sm font-medium text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
