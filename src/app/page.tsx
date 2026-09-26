import DashboardOverview from "@/components/dashboard/dashboard-overview";
import PageSection from "@/components/page-section";
import { UserRole } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/authorization";
import { buildDashboardSummary } from "@/lib/dashboard";
import { Permission } from "@/lib/permissions";
import { loadSecurityReportingData } from "@/lib/reporting-data";

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
  const reportingData = await loadSecurityReportingData();
  const summary = buildDashboardSummary(reportingData);

  return (
    <PageSection title="Dashboard" subtitle={dashboardSubtitles[user.role]}>
      <DashboardOverview role={user.role} summary={summary} />
    </PageSection>
  );
}
