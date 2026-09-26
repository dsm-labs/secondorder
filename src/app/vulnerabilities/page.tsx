import Link from "next/link";
import PageSection from "@/components/page-section";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import {
  Prisma,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  type VulnerabilitySeverity as VulnerabilitySeverityValue,
  type VulnerabilityStatus as VulnerabilityStatusValue,
} from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { formatNumericDisplayDate } from "@/lib/date-format";
import { hasPermission, Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type VulnerabilitiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = [
  { label: "Detection Date Newest", value: "detection_desc" },
  { label: "Detection Date Oldest", value: "detection_asc" },
  { label: "CVSS Score High-Low", value: "cvss_desc" },
  { label: "CVSS Score Low-High", value: "cvss_asc" },
  { label: "Severity High-Low", value: "severity_desc" },
  { label: "Severity Low-High", value: "severity_asc" },
  { label: "Identifier A-Z", value: "identifier_asc" },
  { label: "Title A-Z", value: "title_asc" },
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

function isSeverity(
  value: string | undefined
): value is VulnerabilitySeverityValue {
  return value
    ? Object.values(VulnerabilitySeverity).includes(
        value as VulnerabilitySeverityValue
      )
    : false;
}

function isStatus(
  value: string | undefined
): value is VulnerabilityStatusValue {
  return value
    ? Object.values(VulnerabilityStatus).includes(
        value as VulnerabilityStatusValue
      )
    : false;
}

function getVulnerabilityOrderBy(
  sort: string | undefined
): Prisma.VulnerabilityOrderByWithRelationInput {
  if (sort === "detection_asc") {
    return { detectionDate: "asc" };
  }

  if (sort === "cvss_desc") {
    return { cvssScore: "desc" };
  }

  if (sort === "cvss_asc") {
    return { cvssScore: "asc" };
  }

  if (sort === "severity_desc") {
    return { severity: "desc" };
  }

  if (sort === "severity_asc") {
    return { severity: "asc" };
  }

  if (sort === "identifier_asc") {
    return { identifier: "asc" };
  }

  if (sort === "title_asc") {
    return { title: "asc" };
  }

  return { detectionDate: "desc" };
}

export default async function VulnerabilitiesPage({
  searchParams,
}: VulnerabilitiesPageProps) {
  const user = await requirePermission(Permission.VIEW_VULNERABILITIES);
  const canManageVulnerabilities = hasPermission(
    user.role,
    Permission.MANAGE_VULNERABILITIES
  );
  const params = await searchParams;
  const query = getSingleParam(params.q)?.trim() ?? "";
  const severity = getSingleParam(params.severity);
  const status = getSingleParam(params.status);
  const affectedAssetId = getSingleParam(params.affectedAssetId) ?? "";
  const sort = getSingleParam(params.sort) ?? "detection_desc";
  const hasFilters = Boolean(query || severity || status || affectedAssetId);

  const where: Prisma.VulnerabilityWhereInput = {};

  if (query) {
    where.OR = [
      { identifier: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      {
        affectedAsset: {
          name: { contains: query, mode: "insensitive" },
        },
      },
    ];
  }

  if (isSeverity(severity)) {
    where.severity = severity;
  }

  if (isStatus(status)) {
    where.status = status;
  }

  if (affectedAssetId) {
    where.affectedAssetId = affectedAssetId;
  }

  const [vulnerabilities, assets] = await Promise.all([
    prisma.vulnerability.findMany({
      where,
      include: {
        affectedAsset: true,
      },
      orderBy: getVulnerabilityOrderBy(sort),
    }),
    prisma.asset.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PageSection
      title="Vulnerabilities"
      subtitle="Track vulnerability findings and their affected assets."
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            Showing {vulnerabilities.length} vulnerabilit
            {vulnerabilities.length === 1 ? "y" : "ies"}.
          </p>
          {canManageVulnerabilities ? (
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/vulnerabilities/import"
              >
                Import Findings
              </Link>
              <Link
                className="inline-flex w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/vulnerabilities/new"
              >
                Add Vulnerability
              </Link>
            </div>
          ) : null}
        </div>

        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Search
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={query}
              name="q"
              placeholder="Identifier, title, or asset"
              type="search"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Severity
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isSeverity(severity) ? severity : ""}
              name="severity"
            >
              <option value="">All severities</option>
              {Object.values(VulnerabilitySeverity).map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isStatus(status) ? status : ""}
              name="status"
            >
              <option value="">All statuses</option>
              {Object.values(VulnerabilityStatus).map((item) => (
                <option key={item} value={item}>
                  {formatEnum(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Affected Asset
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={affectedAssetId}
              name="affectedAssetId"
            >
              <option value="">All assets</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
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

          <div className="flex flex-wrap items-end gap-3">
            <button
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Apply
            </button>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href="/vulnerabilities"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                CVE
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Vulnerability
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                CVSS Score
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Severity
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Affected Asset
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
            {vulnerabilities.map((item) => (
              <tr className="border-b border-slate-100" key={item.id}>
                <td className="px-3 py-4 font-medium text-slate-900">
                  <Link
                    className="text-slate-950 underline-offset-4 hover:underline"
                    href={`/vulnerabilities/${item.id}`}
                  >
                    {item.identifier}
                  </Link>
                </td>
                <td className="px-3 py-4 text-slate-600">{item.title}</td>
                <td className="px-3 py-4 text-slate-600">
                  {item.cvssScore.toString()}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  <StatusBadge value={item.severity} />
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {item.affectedAsset.name}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  {formatNumericDisplayDate(item.detectionDate)}
                </td>
                <td className="px-3 py-4 text-slate-600">
                  <StatusBadge value={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vulnerabilities.length === 0 ? (
          <EmptyState
            action={
              hasFilters ? (
                <Link
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/vulnerabilities"
                >
                  Clear Filters
                </Link>
              ) : canManageVulnerabilities ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    href="/vulnerabilities/import"
                  >
                    Import Findings
                  </Link>
                  <Link
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    href="/vulnerabilities/new"
                  >
                    Add Vulnerability
                  </Link>
                </div>
              ) : undefined
            }
            description={
              hasFilters
                ? "Try broadening your search or clearing one or more filters."
                : "No vulnerability findings are currently recorded."
            }
            title={
              hasFilters ? "No matching vulnerabilities" : "No vulnerabilities yet"
            }
          />
        ) : null}
      </div>
    </PageSection>
  );
}
