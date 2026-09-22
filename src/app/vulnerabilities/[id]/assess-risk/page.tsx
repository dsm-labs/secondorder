import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import RiskAssessmentForm from "@/components/risks/risk-assessment-form";
import {
  BusinessImpact,
  DataSensitivity,
  RiskStatus,
} from "@/generated/prisma/client";
import { calculateOrganizationalRisk } from "@/lib/risk-engine";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type AssessRiskPageProps = {
  params: Promise<{ id: string }>;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function AssessRiskPage({ params }: AssessRiskPageProps) {
  await requireUser();
  const { id } = await params;
  const vulnerability = await prisma.vulnerability.findUnique({
    where: { id },
    include: {
      affectedAsset: true,
      riskRecord: true,
    },
  });

  if (!vulnerability) {
    notFound();
  }

  const defaults = {
    dataSensitivity: vulnerability.riskRecord?.dataSensitivity ?? DataSensitivity.MEDIUM,
    businessImpact: vulnerability.riskRecord?.businessImpact ?? BusinessImpact.MEDIUM,
    status: vulnerability.riskRecord?.status ?? RiskStatus.OPEN,
  };
  const preview = calculateOrganizationalRisk({
    cvssScore: Number(vulnerability.cvssScore.toString()),
    assetCriticality: vulnerability.affectedAsset.businessCriticality,
    businessImpact: defaults.businessImpact,
    dataSensitivity: defaults.dataSensitivity,
    internetExposure: vulnerability.affectedAsset.internetExposure,
  });
  const contextDetails = [
    { label: "CVSS", value: vulnerability.cvssScore.toString() },
    { label: "Severity", value: formatEnum(vulnerability.severity) },
    { label: "Affected Asset", value: vulnerability.affectedAsset.name },
    {
      label: "Asset Criticality",
      value: formatEnum(vulnerability.affectedAsset.businessCriticality),
    },
    {
      label: "Internet Exposure",
      value: vulnerability.affectedAsset.internetExposure ? "Yes" : "No",
    },
  ];

  return (
    <PageSection
      title={
        vulnerability.riskRecord
          ? `Reassess ${vulnerability.identifier}`
          : `Assess ${vulnerability.identifier}`
      }
      subtitle="Choose business context and let SecondOrder calculate organizational risk."
    >
      <div className="border-b border-slate-200 pb-6">
        <h3 className="text-base font-semibold text-slate-950">
          Calculation Context
        </h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {contextDetails.map((detail) => (
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

      <div className="my-6 rounded-md border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-950">
          Current Preview
        </p>
        <p className="mt-2 text-sm text-slate-600">
          With the selected/default business context, the calculated risk would
          be {preview.organizationalRiskScore.toFixed(2)} (
          {formatEnum(preview.organizationalRiskLevel)}).
        </p>
      </div>

      <RiskAssessmentForm
        businessImpactOptions={Object.values(BusinessImpact)}
        cancelHref={`/vulnerabilities/${vulnerability.id}`}
        dataSensitivityOptions={Object.values(DataSensitivity)}
        defaults={defaults}
        riskStatusOptions={Object.values(RiskStatus)}
        submitLabel={
          vulnerability.riskRecord ? "Reassess Risk" : "Create Risk Record"
        }
        vulnerabilityId={vulnerability.id}
      />
    </PageSection>
  );
}
