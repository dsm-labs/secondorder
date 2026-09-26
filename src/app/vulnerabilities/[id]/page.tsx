import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import StatusBadge from "@/components/ui/status-badge";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/authorization";
import { formatDisplayDate } from "@/lib/date-format";
import { hasPermission, Permission } from "@/lib/permissions";
import { isUuid } from "@/lib/identifiers";

export const dynamic = "force-dynamic";

type VulnerabilityDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function VulnerabilityDetailPage({
  params,
}: VulnerabilityDetailPageProps) {
  const user = await requirePermission(Permission.VIEW_VULNERABILITIES);
  const canManageVulnerabilities = hasPermission(
    user.role,
    Permission.MANAGE_VULNERABILITIES
  );
  const canAssessRisks = hasPermission(user.role, Permission.ASSESS_RISKS);
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const vulnerability = await prisma.vulnerability.findUnique({
    where: { id },
    include: {
      affectedAsset: {
        include: {
          department: true,
        },
      },
      riskRecord: true,
    },
  });

  if (!vulnerability) {
    notFound();
  }

  const vulnerabilityDetails = [
    { label: "Identifier", value: vulnerability.identifier },
    { label: "CVSS Score", value: vulnerability.cvssScore.toString() },
    {
      label: "Technical Severity",
      value: <StatusBadge value={vulnerability.severity} />,
    },
    {
      label: "Affected Asset",
      value: vulnerability.affectedAsset.name,
    },
    {
      label: "Detection Date",
      value: formatDisplayDate(vulnerability.detectionDate),
    },
    { label: "Status", value: <StatusBadge value={vulnerability.status} /> },
  ];

  const assetDetails = [
    {
      label: "Department",
      value: vulnerability.affectedAsset.department.name,
    },
    {
      label: "Business Criticality",
      value: (
        <StatusBadge value={vulnerability.affectedAsset.businessCriticality} />
      ),
    },
    {
      label: "Internet Exposure",
      value: (
        <StatusBadge
          label={
            vulnerability.affectedAsset.internetExposure
              ? "Internet-Facing"
              : "Internal"
          }
          tone={
            vulnerability.affectedAsset.internetExposure
              ? "warning"
              : "neutral"
          }
          value={
            vulnerability.affectedAsset.internetExposure
              ? "EXPOSED"
              : "INTERNAL"
          }
        />
      ),
    },
  ];

  const riskDetails = vulnerability.riskRecord
    ? [
        {
          label: "Organizational Risk",
          value: (
            <StatusBadge
              value={vulnerability.riskRecord.organizationalRiskLevel}
            />
          ),
        },
        {
          label: "Risk Score",
          value: vulnerability.riskRecord.organizationalRiskScore.toString(),
        },
        {
          label: "Data Sensitivity",
          value: formatEnum(vulnerability.riskRecord.dataSensitivity),
        },
        {
          label: "Business Impact",
          value: formatEnum(vulnerability.riskRecord.businessImpact),
        },
        {
          label: "Risk Status",
          value: <StatusBadge value={vulnerability.riskRecord.status} />,
        },
      ]
    : [];

  return (
    <PageSection
      title={vulnerability.title}
      subtitle="Core vulnerability details and related business context."
    >
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-5">
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/vulnerabilities"
        >
          Back to Vulnerabilities
        </Link>
        {canManageVulnerabilities ? (
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            href={`/vulnerabilities/${vulnerability.id}/edit`}
          >
            Edit Vulnerability
          </Link>
        ) : null}
        {vulnerability.riskRecord ? (
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href={`/risks/${vulnerability.riskRecord.id}`}
          >
            View Risk
          </Link>
        ) : canAssessRisks ? (
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            href={`/vulnerabilities/${vulnerability.id}/assess-risk`}
          >
            Assess Risk
          </Link>
        ) : null}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vulnerabilityDetails.map((detail) => (
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
        <h3 className="text-base font-semibold text-slate-950">Description</h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {vulnerability.description ?? "No description provided."}
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Affected Asset Context
        </h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {assetDetails.map((detail) => (
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
      </div>

      {vulnerability.riskRecord ? (
        <div className="mt-8">
          <h3 className="text-base font-semibold text-slate-950">
            Current Risk Record
          </h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {riskDetails.map((detail) => (
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
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
            {vulnerability.riskRecord.explanation ??
              "No risk explanation provided."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              href={`/risks/${vulnerability.riskRecord.id}`}
            >
              View Risk Detail
            </Link>
            {canAssessRisks ? (
              <Link
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                href={`/vulnerabilities/${vulnerability.id}/assess-risk`}
              >
                Reassess Risk
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-md border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-base font-semibold text-slate-950">
            No Risk Record Yet
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {canAssessRisks
              ? "Assess this vulnerability to calculate organizational risk from technical and business context."
              : "No organizational risk assessment is currently linked to this vulnerability."}
          </p>
          {canAssessRisks ? (
            <Link
              className="mt-4 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={`/vulnerabilities/${vulnerability.id}/assess-risk`}
            >
              Assess Risk
            </Link>
          ) : null}
        </div>
      )}
    </PageSection>
  );
}
