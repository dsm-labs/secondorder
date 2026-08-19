export default function Home() {
  const navigationItems = [
    "Dashboard",
    "Assets",
    "Vulnerabilities",
    "Risks",
    "Remediation",
    "Reports"
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 px-5 py-6 text-white md:flex md:flex-col">
          <div>
            <p className="text-xl font-semibold">SecondOrder</p>
            <p className="mt-1 text-sm text-slate-400">Risk management</p>
          </div>

          <nav className="mt-10 space-y-1" aria-label="Primary navigation">
            {navigationItems.map((item) => (
              <a
                className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
                href="#"
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Phase 1</p>
                <h1 className="text-2xl font-semibold text-slate-950">
                  Application Shell
                </h1>
              </div>
              <p className="text-sm text-slate-500">SecondOrder</p>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">
            <div className="min-h-[420px] rounded-lg border border-slate-200 bg-white" />
          </main>
        </div>
      </div>
    </div>
  );
}
