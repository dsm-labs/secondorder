import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import RiskFactorBreakdown from "@/components/risks/risk-factor-breakdown";
import RiskFreshnessIndicator from "@/components/risks/risk-freshness-indicator";
import { evaluateRiskAssessmentFreshness } from "@/lib/risk-engine";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type RiskDetailPageProps = {
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

export default async function RiskDetailPage({ params }: RiskDetailPageProps) {
  await requireUser();
  const { id } = await params;
  const risk = await prisma.riskRecord.findUnique({
    where: { id },
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
  });

  if (!risk) {
    notFound();
  }

  const freshness = evaluateRiskAssessmentFreshness({
    cvssScore: Number(risk.vulnerability.cvssScore.toString()),
    assetCriticality: risk.vulnerability.affectedAsset.businessCriticality,
    businessImpact: risk.businessImpact,
    dataSensitivity: risk.dataSensitivity,
    internetExposure: risk.vulnerability.affectedAsset.internetExposure,
    storedOrganizationalRiskScore: Number(
      risk.organizationalRiskScore.toString()
    ),
    storedOrganizationalRiskLevel: risk.organizationalRiskLevel,
  });
  const details = [
    {
      label: "Stored Risk Score",
      value: Number(risk.organizationalRiskScore.toString()).toFixed(2),
    },
    {
      label: "Stored Risk Level",
      value: formatEnum(risk.organizationalRiskLevel),
    },
    { label: "Risk Status", value: formatEnum(risk.status) },
    {
      label: "Current Engine Score",
      value: freshness.calculatedRisk.organizationalRiskScore.toFixed(2),
    },
    {
      label: "Current Engine Level",
      value: formatEnum(freshness.calculatedRisk.organizationalRiskLevel),
    },
    {
      label: "Last Updated",
      value: formatDate(risk.updatedAt),
    },
  ];
  const vulnerabilityDetails = [
    {
      label: "Vulnerability",
      value: `${risk.vulnerability.identifier}: ${risk.vulnerability.title}`,
    },
    {
      label: "CVSS / Severity",
      value: `${risk.vulnerability.cvssScore.toString()} / ${formatEnum(
        risk.vulnerability.severity
      )}`,
    },
    {
      label: "Status",
      value: formatEnum(risk.vulnerability.status),
    },
  ];
  const assetDetails = [
    {
      label: "Affected Asset",
      value: risk.vulnerability.affectedAsset.name,
    },
    {
      label: "Department",
      value: risk.vulnerability.affectedAsset.department.name,
    },
    {
      label: "Business Criticality",
      value: formatEnum(risk.vulnerability.affectedAsset.businessCriticality),
    },
    {
      label: "Internet Exposure",
      value: risk.vulnerability.affectedAsset.internetExposure ? "Yes" : "No",
    },
    {
      label: "Data Sensitivity",
      value: formatEnum(risk.dataSensitivity),
    },
    {
      label: "Business Impact",
      value: formatEnum(risk.businessImpact),
    },
  ];

  return (
    <PageSection
      title={risk.vulnerability.title}
      subtitle="Calculated organizational risk for this vulnerability."
    >
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-5">
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/risks"
        >
          Back to Risks
        </Link>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href={`/vulnerabilities/${risk.vulnerability.id}`}
        >
          View Vulnerability
        </Link>
        <Link
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href={`/vulnerabilities/${risk.vulnerability.id}/assess-risk`}
        >
          Reassess Risk
        </Link>
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950">
              Assessment Freshness
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {freshness.explanation}
            </p>
          </div>
          <RiskFreshnessIndicator
            isCurrent={freshness.isCurrent}
            label={freshness.label}
          />
        </div>
        {!freshness.isCurrent ? (
          <p className="mt-3 text-sm text-slate-600">
            Stored score differs from the current engine result by{" "}
            {freshness.scoreDifference.toFixed(2)} point
            {freshness.scoreDifference === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          Vulnerability Context
        </h3>
        <dl className="mt-4 grid gap-4 xl:grid-cols-3">
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
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Business Context
        </h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Stored Explanation
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {risk.explanation ?? "No risk explanation provided."}
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold text-slate-950">
          Current Engine Factor Breakdown
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This read-only breakdown uses the stored data sensitivity and business
          impact plus the current vulnerability and asset context.
        </p>
        <div className="mt-4">
          <RiskFactorBreakdown
            factors={freshness.calculatedRisk.factors}
            finalScore={freshness.calculatedRisk.organizationalRiskScore}
          />
        </div>
      </div>
    </PageSection>
  );
}
