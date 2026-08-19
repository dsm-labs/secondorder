import PageSection from "@/components/page-section";

const dashboardMetrics = [
  { label: "Total Assets", value: "128" },
  { label: "Open Vulnerabilities", value: "342" },
  { label: "Critical Risks", value: "18" },
  { label: "Open Remediation Tasks", value: "37" }
];

export default function Home() {
  return (
    <PageSection
      title="Dashboard"
      subtitle="A simple starting point for the future SecondOrder overview."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <div
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={metric.label}
          >
            <p className="text-sm font-medium text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </PageSection>
  );
}
