import Link from "next/link";
import PageSection from "@/components/page-section";
import {
  AssetStatus,
  BusinessCriticality,
  Prisma,
  type AssetStatus as AssetStatusValue,
  type BusinessCriticality as BusinessCriticalityValue,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type AssetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = [
  { label: "Asset Name A-Z", value: "name_asc" },
  { label: "Asset Name Z-A", value: "name_desc" },
  { label: "Business Criticality High-Low", value: "criticality_desc" },
  { label: "Business Criticality Low-High", value: "criticality_asc" },
  { label: "Status A-Z", value: "status_asc" },
  { label: "Status Z-A", value: "status_desc" },
];

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isBusinessCriticality(
  value: string | undefined
): value is BusinessCriticalityValue {
  return value
    ? Object.values(BusinessCriticality).includes(
        value as BusinessCriticalityValue
      )
    : false;
}

function isAssetStatus(value: string | undefined): value is AssetStatusValue {
  return value
    ? Object.values(AssetStatus).includes(value as AssetStatusValue)
    : false;
}

function getAssetOrderBy(
  sort: string | undefined
): Prisma.AssetOrderByWithRelationInput {
  if (sort === "name_desc") {
    return { name: "desc" };
  }

  if (sort === "criticality_asc") {
    return { businessCriticality: "asc" };
  }

  if (sort === "criticality_desc") {
    return { businessCriticality: "desc" };
  }

  if (sort === "status_desc") {
    return { status: "desc" };
  }

  if (sort === "status_asc") {
    return { status: "asc" };
  }

  return { name: "asc" };
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  await requireUser();
  const params = await searchParams;
  const query = getSingleParam(params.q)?.trim() ?? "";
  const departmentId = getSingleParam(params.departmentId) ?? "";
  const businessCriticality = getSingleParam(params.businessCriticality);
  const status = getSingleParam(params.status);
  const sort = getSingleParam(params.sort) ?? "name_asc";

  const where: Prisma.AssetWhereInput = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { ipAddress: { contains: query, mode: "insensitive" } },
      { operatingSystem: { contains: query, mode: "insensitive" } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (isBusinessCriticality(businessCriticality)) {
    where.businessCriticality = businessCriticality;
  }

  if (isAssetStatus(status)) {
    where.status = status;
  }

  const [assets, departments] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        department: true,
        owner: true,
      },
      orderBy: getAssetOrderBy(sort),
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PageSection
      title="Assets"
      subtitle="Track business and security context for the systems SecondOrder manages."
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {assets.length} asset{assets.length === 1 ? "" : "s"}.
          </p>
          <Link
            className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/assets/new"
          >
            Add Asset
          </Link>
        </div>

        <form className="grid gap-3 lg:grid-cols-5" method="get">
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Search
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={query}
              name="q"
              placeholder="Name, IP address, or OS"
              type="search"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Department
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={departmentId}
              name="departmentId"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Criticality
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={
                isBusinessCriticality(businessCriticality)
                  ? businessCriticality
                  : ""
              }
              name="businessCriticality"
            >
              <option value="">All criticality</option>
              {Object.values(BusinessCriticality).map((criticality) => (
                <option key={criticality} value={criticality}>
                  {formatEnum(criticality)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isAssetStatus(status) ? status : ""}
              name="status"
            >
              <option value="">All statuses</option>
              {Object.values(AssetStatus).map((assetStatus) => (
                <option key={assetStatus} value={assetStatus}>
                  {formatEnum(assetStatus)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Sort
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={sort}
              name="sort"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
            <button
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/assets"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Asset Name
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Asset Type
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                IP Address
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Operating System
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Department
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Business Criticality
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Internet Exposure
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr className="border-b border-slate-100" key={asset.id}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  <Link
                    className="text-slate-950 underline-offset-4 hover:underline"
                    href={`/assets/${asset.id}`}
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.assetType}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.ipAddress ?? "Not specified"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.operatingSystem ?? "Not specified"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.department.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(asset.businessCriticality)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {asset.internetExposure ? "Yes" : "No"}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatEnum(asset.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {assets.length === 0 ? (
          <p className="py-6 text-sm text-slate-500">
            No assets match the current search and filters.
          </p>
        ) : null}
      </div>
    </PageSection>
  );
}
