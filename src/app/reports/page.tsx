import PageSection from "@/components/page-section";

const reportSections = [
  {
    title: "Critical Risks Summary",
    description:
      "Highlights the highest-priority organizational risks for leadership review."
  },
  {
    title: "Vulnerability Overview",
    description:
      "Summarizes open vulnerability exposure across tracked assets."
  },
  {
    title: "Remediation Progress",
    description:
      "Shows a high-level view of remediation work status and follow-up needs."
  },
  {
    title: "Asset Exposure Summary",
    description:
      "Outlines which business systems may require closer security review."
  }
];

export default function ReportsPage() {
  return (
    <PageSection
      title="Reports"
      subtitle="This section will eventually provide executive reporting summaries."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {reportSections.map((section) => (
          <section
            className="rounded-md border border-slate-200 bg-slate-50 p-4"
            key={section.title}
          >
            <h3 className="text-base font-semibold text-slate-900">
              {section.title}
            </h3>
            <p className="mt-2 leading-6 text-slate-600">
              {section.description}
            </p>
          </section>
        ))}
      </div>
    </PageSection>
  );
}
