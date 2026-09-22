import { notFound } from "next/navigation";
import { updateAsset } from "@/app/assets/actions";
import AssetForm from "@/components/assets/asset-form";
import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type EditAssetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  await requireUser();
  const { id } = await params;
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
