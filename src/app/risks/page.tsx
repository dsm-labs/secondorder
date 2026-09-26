import Link from "next/link";
import PageSection from "@/components/page-section";
import RiskFreshnessIndicator from "@/components/risks/risk-freshness-indicator";
import EmptyState from "@/components/ui/empty-state";
import StatusBadge from "@/components/ui/status-badge";
import {
  OrganizationalRiskLevel,
  Prisma,
  RiskStatus,
  type OrganizationalRiskLevel as OrganizationalRiskLevelValue,
  type RiskStatus as RiskStatusValue,
} from "@/generated/prisma/client";
import { evaluateRiskAssessmentFreshness } from "@/lib/risk-engine";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { hasPermission, Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type RisksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const sortOptions = [
  { label: "Risk Score High-Low", value: "score_desc" },
  { label: "Risk Score Low-High", value: "score_asc" },
  { label: "CVSS Score High-Low", value: "cvss_desc" },
  { label: "CVSS Score Low-High", value: "cvss_asc" },
  { label: "Risk Level High-Low", value: "level_desc" },
  { label: "Risk Level Low-High", value: "level_asc" },
  { label: "Vulnerability Title A-Z", value: "title_asc" },
  { label: "Last Updated Newest", value: "updated_desc" },
  { label: "Last Updated Oldest", value: "updated_asc" },
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

function isRiskLevel(
  value: string | undefined
): value is OrganizationalRiskLevelValue {
  return value
    ? Object.values(OrganizationalRiskLevel).includes(
        value as OrganizationalRiskLevelValue
      )
    : false;
}

function isRiskStatus(value: string | undefined): value is RiskStatusValue {
  return value
    ? Object.values(RiskStatus).includes(value as RiskStatusValue)
    : false;
}

function getRiskOrderBy(
  sort: string | undefined
): Prisma.RiskRecordOrderByWithRelationInput[] {
  if (sort === "score_asc") {
    return [{ organizationalRiskScore: "asc" }, { updatedAt: "desc" }];
  }

  if (sort === "cvss_desc") {
    return [{ vulnerability: { cvssScore: "desc" } }, { updatedAt: "desc" }];
  }

  if (sort === "cvss_asc") {
    return [{ vulnerability: { cvssScore: "asc" } }, { updatedAt: "desc" }];
  }

  if (sort === "level_desc") {
    return [
      { organizationalRiskLevel: "desc" },
      { organizationalRiskScore: "desc" },
      { updatedAt: "desc" },
    ];
  }

  if (sort === "level_asc") {
    return [
      { organizationalRiskLevel: "asc" },
      { organizationalRiskScore: "desc" },
      { updatedAt: "desc" },
    ];
  }

  if (sort === "title_asc") {
    return [
      { vulnerability: { title: "asc" } },
      { organizationalRiskScore: "desc" },
      { updatedAt: "desc" },
    ];
  }

  if (sort === "updated_desc") {
    return [{ updatedAt: "desc" }, { organizationalRiskScore: "desc" }];
  }

  if (sort === "updated_asc") {
    return [{ updatedAt: "asc" }, { organizationalRiskScore: "desc" }];
  }

  return [{ organizationalRiskScore: "desc" }, { updatedAt: "desc" }];
}

export default async function RisksPage({ searchParams }: RisksPageProps) {
  const user = await requirePermission(Permission.VIEW_RISKS);
  const canAssessRisks = hasPermission(user.role, Permission.ASSESS_RISKS);
  const params = await searchParams;
  const query = getSingleParam(params.q)?.trim() ?? "";
  const riskLevel = getSingleParam(params.riskLevel);
  const status = getSingleParam(params.status);
  const departmentId = getSingleParam(params.departmentId) ?? "";
  const internetExposure = getSingleParam(params.internetExposure) ?? "";
  const sort = getSingleParam(params.sort) ?? "score_desc";
  const hasFilters = Boolean(
    query || riskLevel || status || departmentId || internetExposure
  );
  const conditions: Prisma.RiskRecordWhereInput[] = [];

  if (query) {
    conditions.push({
      OR: [
        {
          vulnerability: {
            identifier: { contains: query, mode: "insensitive" },
          },
        },
        {
          vulnerability: {
            title: { contains: query, mode: "insensitive" },
          },
        },
        {
          vulnerability: {
            affectedAsset: {
              name: { contains: query, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (isRiskLevel(riskLevel)) {
    conditions.push({ organizationalRiskLevel: riskLevel });
  }

  if (isRiskStatus(status)) {
    conditions.push({ status });
  }

  if (departmentId) {
    conditions.push({
      vulnerability: {
        affectedAsset: { departmentId },
      },
    });
  }

  if (internetExposure === "true" || internetExposure === "false") {
    conditions.push({
      vulnerability: {
        affectedAsset: { internetExposure: internetExposure === "true" },
      },
    });
  }

  const where: Prisma.RiskRecordWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

  const [risks, departments] = await Promise.all([
    prisma.riskRecord.findMany({
      where,
      include: {
        vulnerability: {
          include: {
            affectedAsset: {
              include: {
                department: true,
              },
            },
          },
        },
      },
      orderBy: getRiskOrderBy(sort),
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <PageSection
      title="Risks"
      subtitle="Prioritize vulnerabilities by combining technical severity with business context."
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6">
        <p className="text-sm text-slate-600">
          Showing {risks.length} risk{risks.length === 1 ? "" : "s"} ranked by
          the current sort order.
        </p>

        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" method="get">
          <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
            Search
            <input
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={query}
              name="q"
              placeholder="Identifier, vulnerability, or asset"
              type="search"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Risk Level
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isRiskLevel(riskLevel) ? riskLevel : ""}
              name="riskLevel"
            >
              <option value="">All levels</option>
              {Object.values(OrganizationalRiskLevel).map((level) => (
                <option key={level} value={level}>
                  {formatEnum(level)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={isRiskStatus(status) ? status : ""}
              name="status"
            >
              <option value="">All statuses</option>
              {Object.values(RiskStatus).map((riskStatus) => (
                <option key={riskStatus} value={riskStatus}>
                  {formatEnum(riskStatus)}
                </option>
              ))}
            </select>
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
            Internet Exposure
            <select
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              defaultValue={internetExposure}
              name="internetExposure"
            >
              <option value="">All exposure</option>
              <option value="true">Internet-facing</option>
              <option value="false">Not internet-facing</option>
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
              href="/risks"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1500px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Rank
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Risk / Vulnerability
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Related Asset
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                CVSS / Severity
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Asset Criticality
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Internet Exposure
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Data Sensitivity
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Business Impact
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Risk Score
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Risk Level
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Status
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase text-slate-500">
                Assessment
              </th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, index) => {
              const freshness = evaluateRiskAssessmentFreshness({
                cvssScore: Number(risk.vulnerability.cvssScore.toString()),
                assetCriticality:
                  risk.vulnerability.affectedAsset.businessCriticality,
                businessImpact: risk.businessImpact,
                dataSensitivity: risk.dataSensitivity,
                internetExposure:
                  risk.vulnerability.affectedAsset.internetExposure,
                storedOrganizationalRiskScore: Number(
                  risk.organizationalRiskScore.toString()
                ),
                storedOrganizationalRiskLevel:
                  risk.organizationalRiskLevel,
              });

              return (
                <tr className="border-b border-slate-100" key={risk.id}>
                  <td className="px-3 py-4 font-semibold text-slate-950">
                    #{index + 1}
                  </td>
                  <td className="px-3 py-4 font-medium text-slate-900">
                    <Link
                      className="text-slate-950 underline-offset-4 hover:underline"
                      href={`/risks/${risk.id}`}
                    >
                      {risk.vulnerability.identifier}:{" "}
                      {risk.vulnerability.title}
                    </Link>
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {risk.vulnerability.affectedAsset.name}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {risk.vulnerability.cvssScore.toString()} /{" "}
                    <StatusBadge value={risk.vulnerability.severity} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(
                      risk.vulnerability.affectedAsset.businessCriticality
                    )}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {risk.vulnerability.affectedAsset.internetExposure
                      ? "Yes"
                      : "No"}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(risk.dataSensitivity)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    {formatEnum(risk.businessImpact)}
                  </td>
                  <td className="px-3 py-4 font-semibold text-slate-950">
                    {Number(risk.organizationalRiskScore.toString()).toFixed(2)}
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <StatusBadge value={risk.organizationalRiskLevel} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <StatusBadge value={risk.status} />
                  </td>
                  <td className="px-3 py-4 text-slate-600">
                    <RiskFreshnessIndicator
                      isCurrent={freshness.isCurrent}
                      label={freshness.label}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {risks.length === 0 ? (
          <EmptyState
            action={
              hasFilters ? (
                <Link
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  href="/risks"
                >
                  Clear Filters
                </Link>
              ) : canAssessRisks ? (
                <Link
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  href="/vulnerabilities"
                >
                  Review Vulnerabilities
                </Link>
              ) : undefined
            }
            description={
              hasFilters
                ? "Try broadening your search or clearing one or more filters."
                : "No organizational risk assessments are currently recorded."
            }
            title={hasFilters ? "No matching risks" : "No risks yet"}
          />
        ) : null}
      </div>
    </PageSection>
  );
}
