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
    <section>
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-slate-600">{subtitle}</p>

      <div className="mt-6 min-h-[320px] rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        {children}
      </div>
    </section>
  );
}
