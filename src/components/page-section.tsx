type PageSectionProps = {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
};

export default function PageSection({
  title,
  subtitle,
  children,
}: PageSectionProps) {
  return (
    <section className="min-w-0">
      <h2 className="text-2xl font-semibold leading-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
        {subtitle}
      </p>

      <div className="mt-6 w-full border-y border-slate-200 bg-white p-4 text-sm text-slate-500 sm:p-6">
        {children}
      </div>
    </section>
  );
}
