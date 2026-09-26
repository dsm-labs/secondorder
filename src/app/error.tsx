"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Application render error", error.digest ?? error.name);
  }, [error]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase text-red-700">
        Unable to load this page
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        SecondOrder could not complete this request. Try again, or return to
        the dashboard if the problem continues.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          onClick={retry}
          type="button"
        >
          Try Again
        </button>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          href="/"
        >
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
