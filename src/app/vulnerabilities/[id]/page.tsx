import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";

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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export default async function VulnerabilityDetailPage({
  params,
}: VulnerabilityDetailPageProps) {
  const { id } = await params;
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
    { label: "Technical Severity", value: formatEnum(vulnerability.severity) },
    {
      label: "Affected Asset",
      value: vulnerability.affectedAsset.name,
    },
    {
      label: "Detection Date",
      value: formatDate(vulnerability.detectionDate),
    },
    { label: "Status", value: formatEnum(vulnerability.status) },
  ];

  const assetDetails = [
    {
      label: "Department",
      value: vulnerability.affectedAsset.department.name,
    },
    {
      label: "Business Criticality",
      value: formatEnum(vulnerability.affectedAsset.businessCriticality),
    },
    {
      label: "Internet Exposure",
      value: vulnerability.affectedAsset.internetExposure ? "Yes" : "No",
    },
  ];

  const riskDetails = vulnerability.riskRecord
    ? [
        {
          label: "Organizational Risk",
          value: formatEnum(vulnerability.riskRecord.organizationalRiskLevel),
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
          value: formatEnum(vulnerability.riskRecord.status),
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
        <Link
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href={`/vulnerabilities/${vulnerability.id}/edit`}
        >
          Edit Vulnerability
        </Link>
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
        </div>
      ) : null}
    </PageSection>
  );
}
