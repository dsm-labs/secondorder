type PageSectionProps = {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export default function PageSection({
  title,
  subtitle,
  children
}: PageSectionProps) {
  return (
    <section className="min-w-0">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-slate-600">{subtitle}</p>

      <div className="mt-6 min-h-[320px] w-full rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500 md:p-6">
        {children}
      </div>
    </section>
  );
}
