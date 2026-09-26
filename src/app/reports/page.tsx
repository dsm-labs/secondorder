import PageSection from "@/components/page-section";
import ReportsWorkspace from "@/components/reports/reports-workspace";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";
import { loadSecurityReportingData } from "@/lib/reporting-data";
import { buildReportSummary } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requirePermission(Permission.VIEW_REPORTS);
  const generatedAt = new Date();
  const reportingData = await loadSecurityReportingData();
  const summary = buildReportSummary(reportingData, generatedAt);

  return (
    <PageSection
      title="Reports"
      subtitle="Current security, organizational risk, exposure, and remediation reporting."
    >
      <ReportsWorkspace
        generatedAt={generatedAt}
        role={user.role}
        summary={summary}
      />
    </PageSection>
  );
}
