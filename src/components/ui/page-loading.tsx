export default function PageLoading() {
  return (
    <div aria-live="polite" className="min-w-0" role="status">
      <span className="sr-only">Loading page content</span>
      <div className="animate-pulse">
        <div className="h-7 w-44 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-lg rounded bg-slate-200" />
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="h-24 rounded-md bg-slate-100" key={index} />
            ))}
          </div>
          <div className="mt-7 space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="h-11 rounded bg-slate-100" key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
