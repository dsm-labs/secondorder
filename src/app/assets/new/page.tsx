import { createAsset } from "@/app/assets/actions";
import AssetForm from "@/components/assets/asset-form";
import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

export default async function NewAssetPage() {
  await requireUser();
  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <PageSection
      title="Add Asset"
      subtitle="Create a new asset record with business and security context."
    >
      <AssetForm
        action={createAsset}
        departments={departments}
        submitLabel="Create Asset"
        users={users}
      />
    </PageSection>
  );
}
