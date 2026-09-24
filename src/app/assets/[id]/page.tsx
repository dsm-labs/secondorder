import Link from "next/link";
import { notFound } from "next/navigation";
import ArchiveAssetForm from "@/components/assets/archive-asset-form";
import PageSection from "@/components/page-section";
import { AssetStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { hasPermission, Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type AssetDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const user = await requirePermission(Permission.VIEW_ASSETS);
  const canManageAssets = hasPermission(user.role, Permission.MANAGE_ASSETS);
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      department: true,
      owner: true,
      vulnerabilities: {
        orderBy: { detectionDate: "desc" },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  const details = [
    { label: "Asset Type", value: asset.assetType },
    { label: "IP Address", value: asset.ipAddress ?? "Not specified" },
    {
      label: "Operating System",
      value: asset.operatingSystem ?? "Not specified",
    },
    { label: "Department", value: asset.department.name },
    { label: "Owner", value: asset.owner?.name ?? "No owner selected" },
    {
      label: "Business Criticality",
      value: formatEnum(asset.businessCriticality),
    },
    {
      label: "Internet Exposure",
      value: asset.internetExposure ? "Yes" : "No",
    },
    { label: "Status", value: formatEnum(asset.status) },
  ];

  return (
    <PageSection
      title={asset.name}
      subtitle="Core business and security context for this asset."
    >
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-5">
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/assets"
        >
          Back to Assets
        </Link>
        {canManageAssets ? (
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href={`/assets/${asset.id}/edit`}
          >
            Edit Asset
          </Link>
        ) : null}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {details.map((detail) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={detail.label}
          >
            <dt className="text-xs font-semibold uppercase text-slate-500">
              {detail.label}
            </dt>
            <dd className="mt-2 font-medium text-slate-950">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Related Vulnerabilities
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[700px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Identifier
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Vulnerability
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Severity
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Detection Date
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {asset.vulnerabilities.map((vulnerability) => (
                <tr className="border-b border-slate-100" key={vulnerability.id}>
                  <td className="px-3 py-4 font-medium text-slate-900">
                    {vulnerability.identifier}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {vulnerability.title}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(vulnerability.severity)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatDate(vulnerability.detectionDate)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(vulnerability.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {asset.vulnerabilities.length === 0 ? (
            <p className="py-6 text-sm text-slate-500">
              No vulnerabilities are currently linked to this asset.
            </p>
          ) : null}
        </div>
      </div>

      {canManageAssets && asset.status !== AssetStatus.ARCHIVED ? (
        <ArchiveAssetForm assetId={asset.id} />
      ) : null}
    </PageSection>
  );
}
