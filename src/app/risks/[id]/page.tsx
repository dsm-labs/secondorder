import Link from "next/link";
import { notFound } from "next/navigation";
import PageSection from "@/components/page-section";
import prisma from "@/lib/prisma";

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

export default async function RiskDetailPage({ params }: RiskDetailPageProps) {
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

  const details = [
    {
      label: "Risk Score",
      value: risk.organizationalRiskScore.toString(),
    },
    {
      label: "Risk Level",
      value: formatEnum(risk.organizationalRiskLevel),
    },
    { label: "Status", value: formatEnum(risk.status) },
    {
      label: "Data Sensitivity",
      value: formatEnum(risk.dataSensitivity),
    },
    { label: "Business Impact", value: formatEnum(risk.businessImpact) },
    {
      label: "CVSS",
      value: risk.vulnerability.cvssScore.toString(),
    },
    {
      label: "Asset Criticality",
      value: formatEnum(risk.vulnerability.affectedAsset.businessCriticality),
    },
    {
      label: "Internet Exposure",
      value: risk.vulnerability.affectedAsset.internetExposure ? "Yes" : "No",
    },
    {
      label: "Department",
      value: risk.vulnerability.affectedAsset.department.name,
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
          Explanation
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {risk.explanation ?? "No risk explanation provided."}
        </p>
      </div>
    </PageSection>
  );
}
