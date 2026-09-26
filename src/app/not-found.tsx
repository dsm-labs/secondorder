import Link from "next/link";

export default function NotFound() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase text-slate-500">Not found</p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">
        This record is unavailable
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        The requested page or record may have moved, or you may have followed
        an outdated link.
      </p>
      <Link
        className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        href="/"
      >
        Back to Dashboard
      </Link>
    </section>
  );
}
