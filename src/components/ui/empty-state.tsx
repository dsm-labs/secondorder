type EmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  title: string;
};

export default function EmptyState({
  action,
  description,
  title,
}: EmptyStateProps) {
  return (
    <div className="border-y border-slate-200 px-4 py-10 text-center">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
