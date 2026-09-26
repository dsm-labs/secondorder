import { notFound } from "next/navigation";
import { updateAsset } from "@/app/assets/actions";
import AssetForm from "@/components/assets/asset-form";
import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { Permission } from "@/lib/permissions";
import { isUuid } from "@/lib/identifiers";

export const dynamic = "force-dynamic";

type EditAssetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  await requirePermission(Permission.MANAGE_ASSETS);
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const [asset, departments, users] = await Promise.all([
    prisma.asset.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!asset) {
    notFound();
  }

  const updateAssetWithId = updateAsset.bind(null, asset.id);

  return (
    <PageSection
      title={`Edit ${asset.name}`}
      subtitle="Update this asset's business and security context."
    >
      <AssetForm
        action={updateAssetWithId}
        asset={asset}
        departments={departments}
        submitLabel="Save Asset"
        users={users}
      />
    </PageSection>
  );
}
