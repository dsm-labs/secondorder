import DashboardOverview from "@/components/dashboard/dashboard-overview";
import PageSection from "@/components/page-section";
import { UserRole } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { buildDashboardSummary } from "@/lib/dashboard";
import { Permission } from "@/lib/permissions";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dashboardSubtitles = {
  [UserRole.EXECUTIVE]:
    "A concise view of organizational exposure, business risk, and remediation progress.",
  [UserRole.ANALYST]:
    "Technical findings and organizational risk priorities requiring security review.",
  [UserRole.IT_ADMIN]:
    "Asset exposure and remediation work requiring operational attention.",
  [UserRole.SECURITY_MANAGER]:
    "Organization-wide security risk, technical findings, and remediation performance.",
} satisfies Record<UserRole, string>;

export default async function Home() {
  const user = await requirePermission(Permission.VIEW_DASHBOARD);
  const [assets, vulnerabilities, risks, remediationTasks] = await Promise.all([
    prisma.asset.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        internetExposure: true,
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.vulnerability.findMany({
      select: {
        id: true,
        identifier: true,
        title: true,
        cvssScore: true,
        severity: true,
        status: true,
        affectedAsset: { select: { id: true, name: true } },
      },
    }),
    prisma.riskRecord.findMany({
      select: {
        id: true,
        organizationalRiskLevel: true,
        organizationalRiskScore: true,
        status: true,
        vulnerability: {
          select: {
            id: true,
            identifier: true,
            title: true,
            cvssScore: true,
            severity: true,
            status: true,
            affectedAsset: {
              select: {
                id: true,
                name: true,
                status: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.remediationTask.findMany({
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const summary = buildDashboardSummary({
    assets,
    vulnerabilities: vulnerabilities.map((vulnerability) => ({
      ...vulnerability,
      cvssScore: Number(vulnerability.cvssScore.toString()),
    })),
    risks: risks.map((risk) => ({
      ...risk,
      organizationalRiskScore: Number(
        risk.organizationalRiskScore.toString()
      ),
      vulnerability: {
        ...risk.vulnerability,
        cvssScore: Number(risk.vulnerability.cvssScore.toString()),
      },
    })),
    remediationTasks,
  });

  return (
    <PageSection title="Dashboard" subtitle={dashboardSubtitles[user.role]}>
      <DashboardOverview role={user.role} summary={summary} />
    </PageSection>
  );
}
