import PageSection from "@/components/page-section";
import VulnerabilityImportForm from "@/components/vulnerabilities/vulnerability-import-form";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function VulnerabilityImportPage() {
  await requirePermission(Permission.MANAGE_VULNERABILITIES);

  return (
    <PageSection
      title="Import Vulnerabilities"
      subtitle="Review structured scanner findings before adding them to SecondOrder."
    >
      <VulnerabilityImportForm />
    </PageSection>
  );
}
